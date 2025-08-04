import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import dotenv from 'dotenv';
import { 
  SaaSApp, 
  ScanResult, 
  UserProfile,
  OrganizationProfile, 
  BreachAlert, 
  GhostProfile,
  PrivacyRequest,
  AIAssistantQuery,
  EmailScanResult,
  calculateRiskScore 
} from './types/shared';
import { 
  ThreatAnalyzer, 
  AIAssistant, 
  BusinessBreachMonitor, 
  UnauthorizedAccessDetector 
} from './services/ai';
import passport from './config/oauth';
import { OAuthUser } from './config/oauth';
import authRoutes from './routes/auth';
import { ScannerService } from './services/scanner';
import { initializeDemoData } from './demo-data';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Initialize AI services
const threatAnalyzer = new ThreatAnalyzer();
const aiAssistant = new AIAssistant();
const businessBreachMonitor = new BusinessBreachMonitor();
const unauthorizedAccessDetector = new UnauthorizedAccessDetector();

// Initialize Scanner service
const scannerService = new ScannerService();

// Utility function for compliance scoring
const calculateComplianceScore = (apps: SaaSApp[]): number => {
  if (apps.length === 0) return 100;
  
  let complianceScore = 100;
  
  for (const app of apps) {
    // Deduct points for compliance issues
    if (app.riskLevel === 'CRITICAL') complianceScore -= 15;
    if (app.riskLevel === 'HIGH') complianceScore -= 10;
    if (app.hasBreaches) complianceScore -= 8;
    if (app.thirdPartySharing && !app.contractDetails?.dataProcessingAgreement) complianceScore -= 5;
    if (app.passwordStrength === 'WEAK') complianceScore -= 3;
  }
  
  return Math.max(0, Math.round(complianceScore));
};

// Mock database (replace with real database in production)
let organizations: OrganizationProfile[] = [];
let users: UserProfile[] = [];
let scanResults: ScanResult[] = [];
let privacyRequests: PrivacyRequest[] = [];
let breachAlerts: BreachAlert[] = [];
let ghostProfiles: GhostProfile[] = [];

// Initialize demo data for MVP testing
const demoData = initializeDemoData();
organizations = [...demoData.organizations];
users = [...demoData.users];

// Basic validation middleware
const validateRequired = (fields: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const missing = fields.filter(field => !req.body[field]);
    if (missing.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missing: missing,
        message: `The following fields are required: ${missing.join(', ')}`
      });
    }
    next();
  };
};

// Routes

// Auth routes
app.use('/auth', authRoutes);

// Organization Management
app.post('/api/organizations', validateRequired(['name', 'domain', 'email']), (req, res) => {
  const { name, domain, email, industry, size, employeeCount, complianceRequirements } = req.body;

  const existingOrg = organizations.find(o => o.domain === domain);
  if (existingOrg) {
    return res.json(existingOrg);
  }

  const newOrg: OrganizationProfile = {
    id: `org_${Date.now()}`,
    name,
    domain,
    email,
    industry: industry || 'Technology',
    size: size || 'STARTUP',
    riskScore: 0,
    totalApps: 0,
    highRiskApps: 0,
    criticalApps: 0,
    employeeCount: employeeCount || 1,
    complianceRequirements: complianceRequirements || [],
    preferences: {
      breachAlerts: true,
      weeklyReports: true,
      autoPrivacyRequests: false,
      complianceMonitoring: true,
    },
  };

  organizations.push(newOrg);
  res.status(201).json(newOrg);
});

app.get('/api/organizations/:orgId', (req, res) => {
  const org = organizations.find(o => o.id === req.params.orgId);
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  res.json(org);
});

app.put('/api/organizations/:orgId', (req, res) => {
  const orgIndex = organizations.findIndex(o => o.id === req.params.orgId);
  if (orgIndex === -1) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  organizations[orgIndex] = { ...organizations[orgIndex], ...req.body };
  res.json(organizations[orgIndex]);
});

// Enhanced health check
app.get('/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'GhostScan Business API',
    version: '1.0.0-mvp',
    database: 'In-Memory (Demo)',
    features: {
      oauth: ['google', 'microsoft'],
      scanning: ['google-workspace', 'microsoft-365'],
      compliance: ['gdpr', 'ccpa'],
    },
    demo_data: {
      organizations: organizations.length,
      users: users.length,
      scan_results: scanResults.length
    }
  };
  res.json(healthData);
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'GhostScan Business API',
    description: 'Privacy & Security Management for Startups and SMBs',
    version: '1.0.0-mvp',
    endpoints: {
      health: 'GET /health',
      organizations: 'GET|POST /api/organizations',
      scanning: 'POST /api/scan',
      breaches: 'GET /api/breaches/:organizationId',
      insights: 'GET /api/insights/:organizationId',
      dashboard: 'GET /api/dashboard/:organizationId',
      auth: {
        google: 'GET /auth/google',
        microsoft: 'GET /auth/microsoft',
        status: 'GET /auth/status'
      }
    },
    demo_organizations: organizations.map(org => ({
      id: org.id,
      name: org.name,
      domain: org.domain,
      size: org.size
    }))
  });
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
    name: email.split('@')[0],
    role: 'ADMIN',
    organizationId: `org_${Date.now()}`,
    permissions: ['read', 'write', 'admin'],
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
app.post('/api/scan', validateRequired(['organizationId']), async (req, res) => {
  const { organizationId, scanType = 'COMPREHENSIVE', scope = 'ORGANIZATION' } = req.body;

  try {
    console.log('Starting comprehensive scan for organization:', organizationId);
    
    // Add OAuth connections to scanner if authenticated
    if (req.user) {
      const oauthUser = req.user as OAuthUser;
      scannerService.addConnection(oauthUser);
      console.log('Added OAuth connection:', oauthUser.provider);
    }

    // Perform comprehensive scan using real API connections
    const scanResult = await scannerService.performComprehensiveScan();
    
    // Add organization context to scan result
    const enhancedScanResult: ScanResult = {
      ...scanResult,
      organizationId,
      complianceScore: calculateComplianceScore(scanResult.apps),
      scopeDescription: `${scope} scan including ${scanResult.apps.length} applications`,
      employeesScanned: scanResult.apps.reduce((sum, app) => sum + app.employeeCount, 0),
      departmentsScanned: [...new Set(scanResult.apps.flatMap(app => app.departments))]
    };
    
    console.log(`Scan completed: ${enhancedScanResult.apps.length} apps found, risk score: ${enhancedScanResult.totalRiskScore}`);
    
    scanResults.push(enhancedScanResult);

    // Update organization profile
    const orgIndex = organizations.findIndex(o => o.id === organizationId);
    if (orgIndex !== -1) {
      organizations[orgIndex] = {
        ...organizations[orgIndex],
        riskScore: enhancedScanResult.totalRiskScore,
        totalApps: enhancedScanResult.apps.length,
        highRiskApps: enhancedScanResult.apps.filter(app => app.riskLevel === 'HIGH').length,
        criticalApps: enhancedScanResult.apps.filter(app => app.riskLevel === 'CRITICAL').length,
        lastScanDate: new Date(),
      };
    }

    res.json(enhancedScanResult);
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Scan failed', details: error instanceof Error ? error.message : 'Unknown error' });
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
app.get('/api/breaches/:organizationId', async (req, res) => {
  const { organizationId } = req.params;
  const organization = organizations.find(o => o.id === organizationId);
  
  if (!organization) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  try {
    // Check for business breaches
    const breaches = await businessBreachMonitor.checkForBusinessBreaches(organization.domain);
    
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

// Unauthorized Access Detection
app.get('/api/unauthorized-access/:organizationId', async (req, res) => {
  const { organizationId } = req.params;
  const organization = organizations.find(o => o.id === organizationId);
  
  if (!organization) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  try {
    const unauthorizedAccounts = await unauthorizedAccessDetector.detectUnauthorizedAccounts(organization.domain);
    
    // Store unauthorized accounts for tracking
    ghostProfiles.push(...unauthorizedAccounts);
    
    res.json({ 
      unauthorizedAccounts,
      summary: {
        total: unauthorizedAccounts.length,
        highConfidence: unauthorizedAccounts.filter(acc => acc.confidence > 0.8).length,
        platformsAffected: [...new Set(unauthorizedAccounts.map(acc => acc.platform))]
      }
    });
  } catch (error) {
    console.error('Unauthorized access detection error:', error);
    res.status(500).json({ error: 'Failed to detect unauthorized access' });
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
    organizationId: userId, // Using userId as organizationId for now
    requestedBy: req.user ? (req.user as any).email : 'unknown',
    scope: 'ORGANIZATION',
    status: 'PENDING',
    createdAt: new Date(),
  };

  privacyRequests.push(privacyRequest);
  res.status(201).json(privacyRequest);
});

app.get('/api/privacy-requests/:userId', (req, res) => {
  const userRequests = privacyRequests.filter(r => r.organizationId === req.params.userId);
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
      context: {
        organizationId: userId,
        userId: req.user ? (req.user as any).id : 'unknown',
        ...context
      },
      category: 'GENERAL',
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

// Business Insights
app.get('/api/insights/:organizationId', async (req, res) => {
  const { organizationId } = req.params;
  const orgScans = scanResults.filter(s => s.organizationId === organizationId);
  const latestScan = orgScans[orgScans.length - 1];
  
  if (!latestScan) {
    return res.json({ insights: [] });
  }

  try {
    const insights = await aiAssistant.generateBusinessInsights(latestScan.apps);
    res.json({ insights });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Connected Platforms
app.get('/api/platforms/:userId', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const connections = scannerService.getConnections();
  res.json({ 
    platforms: connections.map(conn => ({
      provider: conn.provider,
      status: conn.status,
      email: conn.user.email,
      connectedAt: new Date(), // You'd store this in a real database
    }))
  });
});

// Business Dashboard Stats
app.get('/api/dashboard/:organizationId', (req, res) => {
  const { organizationId } = req.params;
  const organization = organizations.find(o => o.id === organizationId);
  
  if (!organization) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  const orgScans = scanResults.filter(s => s.organizationId === organizationId);
  const latestScan = orgScans[orgScans.length - 1];
  const orgBreaches = breachAlerts.filter(b => b.appId === organizationId);
  const orgUnauthorizedAccounts = ghostProfiles.filter(g => g.email.includes(organization.domain));
  const connections = scannerService.getConnections();

  const stats = {
    organization,
    latestScan: latestScan || null,
    totalApps: latestScan?.apps.length || 0,
    riskScore: organization.riskScore,
    complianceScore: latestScan?.complianceScore || 100,
    breachCount: orgBreaches.length,
    unauthorizedAccountCount: orgUnauthorizedAccounts.length,
    newBreaches: orgBreaches.filter(b => b.isNew).length,
    connectedPlatforms: connections.length,
    platformStatus: connections.map(c => ({ provider: c.provider, status: c.status })),
    departmentCoverage: latestScan ? [...new Set(latestScan.apps.flatMap(app => app.departments))] : [],
    businessCriticalApps: latestScan?.apps.filter(app => app.businessCritical).length || 0,
    complianceGaps: latestScan?.apps.filter(app => app.thirdPartySharing && !app.contractDetails?.dataProcessingAgreement).length || 0
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
  console.log(`🚀 GhostScan Business API running on port ${PORT}`);
  console.log(`🏢 Serving startups and SMBs with privacy & security management`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 API Documentation: http://localhost:${PORT}/api`);
});
