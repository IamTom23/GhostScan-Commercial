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
// Import Supabase client and DAOs
import {
  db,
  testSupabaseConnection,
  supabaseOrganizationDAO,
  supabaseUserDAO
} from './lib/supabase';
// Import authentication middleware
import { 
  authenticateJWT, 
  optionalAuth, 
  requireRole, 
  requireOrganizationAccess, 
  AuthenticatedRequest 
} from './middleware/auth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

// CORS configuration for development and production
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173', // Development
  process.env.FRONTEND_URL_PRODUCTION || 'https://app.cloudyx.io', // Production
  'https://app.cloudyx.io', // Explicit production URL
  'http://localhost:5173' // Explicit development URL
];

app.use(cors({
  origin: allowedOrigins,
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

// Initialize Supabase connection
let supabaseReady = false;

// Test Supabase connection
testSupabaseConnection().then(result => {
  if (result.success) {
    console.log('✅ Supabase connected successfully');
    console.log('   Service:', result.details?.service);
    supabaseReady = true;
  } else {
    console.error('❌ Supabase connection failed:', result.message);
    console.log('   Falling back to demo mode');
    supabaseReady = false;
  }
}).catch(error => {
  console.error('❌ Supabase initialization error:', error);
  supabaseReady = false;
});

// In-memory fallback for when database is not available
let fallbackOrganizations: OrganizationProfile[] = [];
let fallbackUsers: UserProfile[] = [];
let scanResults: ScanResult[] = [];
let privacyRequests: PrivacyRequest[] = [];
let breachAlerts: BreachAlert[] = [];
let ghostProfiles: GhostProfile[] = [];

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
app.post('/api/organizations', optionalAuth, validateRequired(['name', 'domain', 'email']), async (req, res) => {
  const { name, domain, email, industry, size, employeeCount, complianceRequirements } = req.body;

  try {
    if (supabaseReady) {
      // Check if organization already exists
      const slug = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const existingOrg = await supabaseOrganizationDAO.findBySlug(slug);
      if (existingOrg) {
        return res.json(existingOrg);
      }

      // Create new organization
      const newOrg = await supabaseOrganizationDAO.create({
        name,
        slug,
        type: size?.toLowerCase() === 'enterprise' ? 'enterprise' : size?.toLowerCase() === 'smb' ? 'smb' : 'startup',
        employees: employeeCount || 1,
        industry: industry || 'Technology',
        website: domain,
        primaryEmail: email
      });

      res.status(201).json(newOrg);
    } else {
      // Fallback to in-memory storage
      const existingOrg = fallbackOrganizations.find(o => o.domain === domain);
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

      fallbackOrganizations.push(newOrg);
      res.status(201).json(newOrg);
    }
  } catch (error) {
    console.error('Organization creation error:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

app.get('/api/organizations/:orgId', authenticateJWT, requireOrganizationAccess, async (req, res) => {
  try {
    if (supabaseReady) {
      const org = await supabaseOrganizationDAO.getWithStats(req.params.orgId);
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      res.json(org);
    } else {
      // Fallback to in-memory storage
      const org = fallbackOrganizations.find(o => o.id === req.params.orgId);
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      res.json(org);
    }
  } catch (error) {
    console.error('Organization fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

app.put('/api/organizations/:orgId', authenticateJWT, requireOrganizationAccess, async (req, res) => {
  try {
    if (supabaseReady) {
      const { securityGrade, privacyScore, lastScanAt } = req.body;
      const updatedOrg = await supabaseOrganizationDAO.updateSecurityMetrics(req.params.orgId, {
        securityGrade,
        privacyScore,
        lastScanAt: lastScanAt ? new Date(lastScanAt) : undefined
      });
      if (!updatedOrg) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      res.json(updatedOrg);
    } else {
      // Fallback to in-memory storage
      const orgIndex = fallbackOrganizations.findIndex(o => o.id === req.params.orgId);
      if (orgIndex === -1) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      fallbackOrganizations[orgIndex] = { ...fallbackOrganizations[orgIndex], ...req.body };
      res.json(fallbackOrganizations[orgIndex]);
    }
  } catch (error) {
    console.error('Organization update error:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

// Enhanced health check
app.get('/health', async (req, res) => {
  let dbStatus = 'In-Memory (Demo)';
  let dbDetails = null;
  
  if (supabaseReady) {
    const dbTest = await testSupabaseConnection();
    dbStatus = dbTest.success ? 'Supabase (Connected)' : 'Supabase (Error)';
    dbDetails = dbTest.details;
  }
  
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Cloudyx API',
    version: '1.0.0-mvp',
    database: dbStatus,
    database_details: dbDetails,
    features: {
      oauth: ['google', 'microsoft'],
      scanning: ['google-workspace', 'microsoft-365'],
      compliance: ['gdpr', 'ccpa'],
    },
    demo_data: {
      organizations: supabaseReady ? 'Supabase mode' : fallbackOrganizations.length,
      users: supabaseReady ? 'Supabase mode' : fallbackUsers.length,
      scan_results: scanResults.length
    }
  };
  res.json(healthData);
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Cloudyx API',
    description: 'AI-Powered SaaS Security Management Platform',
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
    demo_organizations: supabaseReady ? 'Supabase mode - use API endpoints' : fallbackOrganizations.map(org => ({
      id: org.id,
      name: org.name,
      domain: org.domain,
      size: org.size
    }))
  });
});

// User Management
app.post('/api/users', async (req, res) => {
  const { email, organizationId } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    if (supabaseReady) {
      // Check if user already exists
      const existingUser = await supabaseUserDAO.findByEmail(email);
      if (existingUser) {
        return res.json(existingUser);
      }

      // Create new user
      const newUser = await supabaseUserDAO.create({
        organizationId: organizationId || `org_${Date.now()}`,
        email,
        firstName: email.split('@')[0],
        role: 'admin'
      });

      res.status(201).json(newUser);
    } else {
      // Fallback to in-memory storage
      const existingUser = fallbackUsers.find(u => u.email === email);
      if (existingUser) {
        return res.json(existingUser);
      }

      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        email,
        name: email.split('@')[0],
        role: 'ADMIN',
        organizationId: organizationId || `org_${Date.now()}`,
        permissions: ['read', 'write', 'admin'],
      };

      fallbackUsers.push(newUser);
      res.status(201).json(newUser);
    }
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    if (supabaseReady) {
      // In a real implementation, you'd have a findById method
      // For now, we'll use email-based lookup
      const user = await supabaseUserDAO.findByEmail(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } else {
      // Fallback to in-memory storage
      const user = fallbackUsers.find(u => u.id === req.params.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    }
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Scanning
app.post('/api/scan', authenticateJWT, validateRequired(['organizationId']), async (req, res) => {
  const { organizationId, scanType = 'COMPREHENSIVE', scope = 'ORGANIZATION' } = req.body;
  const user = req.user as OAuthUser;

  // Verify user has access to this organization
  if (user?.organizationId !== organizationId) {
    return res.status(403).json({ error: 'Access denied', message: 'You can only scan your own organization' });
  }

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
    if (supabaseReady) {
      await supabaseOrganizationDAO.updateSecurityMetrics(organizationId, {
        privacyScore: enhancedScanResult.totalRiskScore,
        lastScanAt: new Date()
      });
    } else {
      // Fallback to in-memory storage
      const orgIndex = fallbackOrganizations.findIndex(o => o.id === organizationId);
      if (orgIndex !== -1) {
        fallbackOrganizations[orgIndex] = {
          ...fallbackOrganizations[orgIndex],
          riskScore: enhancedScanResult.totalRiskScore,
          totalApps: enhancedScanResult.apps.length,
          highRiskApps: enhancedScanResult.apps.filter(app => app.riskLevel === 'HIGH').length,
          criticalApps: enhancedScanResult.apps.filter(app => app.riskLevel === 'CRITICAL').length,
          lastScanDate: new Date(),
        };
      }
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
  let organization;
  if (supabaseReady) {
    organization = await supabaseOrganizationDAO.findById(organizationId);
  } else {
    organization = fallbackOrganizations.find(o => o.id === organizationId);
  }
  
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
  let organization;
  if (supabaseReady) {
    organization = await supabaseOrganizationDAO.findById(organizationId);
  } else {
    organization = fallbackOrganizations.find(o => o.id === organizationId);
  }
  
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
app.get('/api/dashboard/:organizationId', authenticateJWT, requireOrganizationAccess, async (req, res) => {
  const { organizationId } = req.params;
  let organization;
  if (supabaseReady) {
    organization = await supabaseOrganizationDAO.findById(organizationId);
  } else {
    organization = fallbackOrganizations.find(o => o.id === organizationId);
  }
  
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
  console.log(`🚀 Cloudyx API running on port ${PORT}`);
  console.log(`🏢 AI-Powered SaaS Security Management Platform`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 API Documentation: http://localhost:${PORT}/api`);
});
