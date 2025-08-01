import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { 
  SaaSApp, 
  ScanResult, 
  UserProfile, 
  BreachAlert, 
  GhostProfile,
  PrivacyRequest,
  AIAssistantQuery,
  EmailScanResult,
  calculateRiskScore 
} from '@ghostscan/shared';
import { 
  ThreatAnalyzer, 
  AIAssistant, 
  BreachMonitor, 
  GhostProfileDetector 
} from '@ghostscan/ai';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize AI services
const threatAnalyzer = new ThreatAnalyzer();
const aiAssistant = new AIAssistant();
const breachMonitor = new BreachMonitor();
const ghostDetector = new GhostProfileDetector();

// Mock database (replace with real database in production)
let users: UserProfile[] = [];
let scanResults: ScanResult[] = [];
let privacyRequests: PrivacyRequest[] = [];
let breachAlerts: BreachAlert[] = [];
let ghostProfiles: GhostProfile[] = [];

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// User Management
app.post('/api/users', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.json(existingUser);
  }

  const newUser: UserProfile = {
    id: `user_${Date.now()}`,
    email,
    riskScore: 0,
    totalApps: 0,
    highRiskApps: 0,
    preferences: {
      breachAlerts: true,
      weeklyReports: true,
      autoPrivacyRequests: false,
    },
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

app.get('/api/users/:userId', (req, res) => {
  const user = users.find(u => u.id === req.params.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Scanning
app.post('/api/scan', async (req, res) => {
  const { userId, scanType = 'COMPREHENSIVE' } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Simulate scanning process
    const mockApps: SaaSApp[] = [
      {
        id: '1',
        name: 'Canva',
        domain: 'canva.com',
        riskLevel: 'MEDIUM',
        dataTypes: ['personal', 'creative'],
        hasBreaches: false,
        thirdPartySharing: true,
        lastAccessed: new Date('2024-01-15'),
        oauthProvider: 'Google',
        accountStatus: 'ACTIVE',
        passwordStrength: 'STRONG',
      },
      {
        id: '2',
        name: 'Grammarly',
        domain: 'grammarly.com',
        riskLevel: 'HIGH',
        dataTypes: ['personal', 'writing', 'documents'],
        hasBreaches: true,
        thirdPartySharing: true,
        lastAccessed: new Date('2024-01-10'),
        accountStatus: 'ACTIVE',
        passwordStrength: 'WEAK',
        isReused: true,
      },
      {
        id: '3',
        name: 'Adobe Creative Cloud',
        domain: 'adobe.com',
        riskLevel: 'LOW',
        dataTypes: ['personal', 'creative'],
        hasBreaches: false,
        thirdPartySharing: false,
        lastAccessed: new Date('2024-01-20'),
        accountStatus: 'ACTIVE',
        passwordStrength: 'STRONG',
      },
    ];

    // Analyze each app
    const analyzedApps = await Promise.all(
      mockApps.map(async (app) => {
        const analysis = await threatAnalyzer.analyzeApp(app);
        return {
          ...app,
          riskLevel: analysis.riskLevel,
        };
      })
    );

    const scanResult: ScanResult = {
      apps: analyzedApps,
      totalRiskScore: calculateRiskScore(analyzedApps),
      recommendations: [
        'Change passwords for breached accounts',
        'Enable two-factor authentication',
        'Review privacy settings for high-risk apps',
      ],
      timestamp: new Date(),
      scanType: scanType as any,
    };

    scanResults.push(scanResult);

    // Update user profile
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        riskScore: scanResult.totalRiskScore,
        totalApps: analyzedApps.length,
        highRiskApps: analyzedApps.filter(app => app.riskLevel === 'HIGH' || app.riskLevel === 'CRITICAL').length,
        lastScanDate: new Date(),
      };
    }

    res.json(scanResult);
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Scan failed' });
  }
});

app.get('/api/scan/:userId/latest', (req, res) => {
  const userScans = scanResults.filter(s => s.apps.some(app => app.id === req.params.userId));
  const latestScan = userScans[userScans.length - 1];
  
  if (!latestScan) {
    return res.status(404).json({ error: 'No scan results found' });
  }
  
  res.json(latestScan);
});

// Apps Management
app.get('/api/apps/:userId', (req, res) => {
  const userScans = scanResults.filter(s => s.apps.some(app => app.id === req.params.userId));
  const latestScan = userScans[userScans.length - 1];
  
  if (!latestScan) {
    return res.json({ apps: [] });
  }
  
  res.json({ apps: latestScan.apps });
});

app.get('/api/apps/:userId/:appId', (req, res) => {
  const { userId, appId } = req.params;
  const userScans = scanResults.filter(s => s.apps.some(app => app.id === userId));
  const latestScan = userScans[userScans.length - 1];
  
  if (!latestScan) {
    return res.status(404).json({ error: 'App not found' });
  }
  
  const app = latestScan.apps.find(a => a.id === appId);
  if (!app) {
    return res.status(404).json({ error: 'App not found' });
  }
  
  res.json(app);
});

// Breach Monitoring
app.get('/api/breaches/:userId', async (req, res) => {
  const { userId } = req.params;
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    // Check for breaches
    const breaches = await breachMonitor.checkForBreaches(user.email);
    
    // Add mock breach for demonstration
    const mockBreach: BreachAlert = {
      id: `breach_${Date.now()}`,
      appId: '2', // Grammarly
      breachDate: new Date('2024-01-05'),
      dataTypes: ['emails', 'passwords'],
      severity: 'HIGH',
      description: 'Data breach affecting 3.2M users',
      isNew: true,
    };

    const userBreaches = [mockBreach, ...breaches];
    breachAlerts.push(...userBreaches);
    
    res.json({ breaches: userBreaches });
  } catch (error) {
    console.error('Breach check error:', error);
    res.status(500).json({ error: 'Failed to check breaches' });
  }
});

// Ghost Profile Detection
app.get('/api/ghosts/:userId', async (req, res) => {
  const { userId } = req.params;
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    const ghosts = await ghostDetector.detectGhostProfiles(user.email);
    
    // Add mock ghost profile for demonstration
    const mockGhost: GhostProfile = {
      id: `ghost_${Date.now()}`,
      platform: 'LinkedIn',
      email: user.email,
      username: 'user_profile',
      foundVia: 'SHADOW_PROFILE',
      confidence: 0.95,
      dataExposed: ['name', 'email', 'work_history'],
    };

    const userGhosts = [mockGhost, ...ghosts];
    ghostProfiles.push(...userGhosts);
    
    res.json({ ghosts: userGhosts });
  } catch (error) {
    console.error('Ghost detection error:', error);
    res.status(500).json({ error: 'Failed to detect ghost profiles' });
  }
});

// Privacy Requests
app.post('/api/privacy-requests', (req, res) => {
  const { userId, appId, type } = req.body;

  if (!userId || !appId || !type) {
    return res.status(400).json({ error: 'User ID, App ID, and type are required' });
  }

  const privacyRequest: PrivacyRequest = {
    id: `request_${Date.now()}`,
    type: type as 'DELETE' | 'EXPORT' | 'OPT_OUT',
    appId,
    userId,
    status: 'PENDING',
    createdAt: new Date(),
  };

  privacyRequests.push(privacyRequest);
  res.status(201).json(privacyRequest);
});

app.get('/api/privacy-requests/:userId', (req, res) => {
  const userRequests = privacyRequests.filter(r => r.userId === req.params.userId);
  res.json({ requests: userRequests });
});

// AI Assistant
app.post('/api/assistant/query', async (req, res) => {
  const { userId, question, context } = req.body;

  if (!userId || !question) {
    return res.status(400).json({ error: 'User ID and question are required' });
  }

  try {
    const query: AIAssistantQuery = {
      id: `query_${Date.now()}`,
      question,
      context: context || {},
      timestamp: new Date(),
    };

    const response = await aiAssistant.processQuery(query);
    
    res.json({
      queryId: query.id,
      response,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('AI Assistant error:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

// Email Scanner
app.post('/api/email-scan', async (req, res) => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: 'User ID and email are required' });
  }

  try {
    // Simulate email scanning
    const emailScanResult: EmailScanResult = {
      id: `email_scan_${Date.now()}`,
      email,
      subscriptions: [
        {
          service: 'Netflix',
          frequency: 'monthly',
          lastEmail: new Date('2024-01-20'),
          category: 'entertainment',
        },
        {
          service: 'Spotify',
          frequency: 'monthly',
          lastEmail: new Date('2024-01-18'),
          category: 'entertainment',
        },
      ],
      signups: [
        {
          service: 'Canva',
          signupDate: new Date('2024-01-15'),
          status: 'ACTIVE',
        },
        {
          service: 'Grammarly',
          signupDate: new Date('2024-01-10'),
          status: 'ACTIVE',
        },
      ],
    };

    res.json(emailScanResult);
  } catch (error) {
    console.error('Email scan error:', error);
    res.status(500).json({ error: 'Failed to scan email' });
  }
});

// Privacy Insights
app.get('/api/insights/:userId', async (req, res) => {
  const { userId } = req.params;
  const userScans = scanResults.filter(s => s.apps.some(app => app.id === userId));
  const latestScan = userScans[userScans.length - 1];
  
  if (!latestScan) {
    return res.json({ insights: [] });
  }

  try {
    const insights = await aiAssistant.generatePrivacyInsights(latestScan.apps);
    res.json({ insights });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Dashboard Stats
app.get('/api/dashboard/:userId', (req, res) => {
  const { userId } = req.params;
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userScans = scanResults.filter(s => s.apps.some(app => app.id === userId));
  const latestScan = userScans[userScans.length - 1];
  const userBreaches = breachAlerts.filter(b => b.appId === userId);
  const userGhosts = ghostProfiles.filter(g => g.email === user.email);

  const stats = {
    user,
    latestScan: latestScan || null,
    breachCount: userBreaches.length,
    ghostCount: userGhosts.length,
    newBreaches: userBreaches.filter(b => b.isNew).length,
  };

  res.json(stats);
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 GhostScan Personal API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 API Documentation: http://localhost:${PORT}/api`);
});
