// Vercel serverless function for organization dashboard data
// Phase 1: Hybrid mode - Uses database when available, falls back to demo data

// Database connection (optional)
let database, organizationDAO, applicationDAO, breachAlertDAO;
const isDatabaseEnabled = process.env.ENABLE_DATABASE === 'true';

async function initializeDatabase() {
  if (!isDatabaseEnabled) {
    return;
  }

  try {
    const dbModule = await import('../../lib/database.ts');
    database = dbModule.default;
    organizationDAO = dbModule.organizationDAO;
    applicationDAO = dbModule.applicationDAO;
    breachAlertDAO = dbModule.breachAlertDAO;
    console.log('[API] Database modules loaded successfully');
  } catch (error) {
    console.warn('[API] Database modules failed to load, falling back to demo data:', error.message);
  }
}

// Demo data for fallback
const getDemoOrganizations = () => [
  {
    id: 'org_demo_startup',
    name: 'TechFlow Startup',
    type: 'startup',
    employees: 12,
    industry: 'Technology',
    website: 'techflow.io',
    scanResults: {
      totalApps: 15,
      highRiskApps: 3,
      dataExposure: 28,
      privacyScore: 72,
      lastScan: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    recommendations: [
      'Enable two-factor authentication on all high-risk applications',
      'Review and update privacy settings for Grammarly',
      'Implement regular security training for all employees',
      'Set up automated privacy monitoring alerts'
    ],
    breaches: [
      {
        id: 'breach_grammarly_2024',
        service: 'Grammarly',
        date: new Date('2024-01-05'),
        severity: 'high',
        affectedData: ['emails', 'documents', 'writing_data']
      }
    ]
  },
  {
    id: 'org_demo_smb',
    name: 'GrowthCorp SMB',
    type: 'smb',
    employees: 45,
    industry: 'Marketing',
    website: 'growthcorp.com',
    scanResults: {
      totalApps: 28,
      highRiskApps: 5,
      dataExposure: 42,
      privacyScore: 58,
      lastScan: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    recommendations: [
      'Conduct comprehensive privacy audit across all departments',
      'Implement data classification and handling policies',
      'Review third-party vendor contracts for GDPR compliance',  
      'Set up incident response procedures'
    ],
    breaches: [
      {
        id: 'breach_mailchimp_2024',
        service: 'MailChimp',
        date: new Date('2024-01-12'),
        severity: 'medium',
        affectedData: ['email_lists', 'campaign_data', 'subscriber_info']
      },
      {
        id: 'breach_hubspot_2024', 
        service: 'HubSpot',
        date: new Date('2024-01-08'),
        severity: 'low',
        affectedData: ['contact_data', 'interaction_logs']
      }
    ]
  }
];

// Get organization data from database
async function getOrganizationFromDatabase(orgId) {
  if (!database || !organizationDAO) {
    return null;
  }

  try {
    // Test database connection first
    const connectionTest = await database.testConnection();
    if (!connectionTest.success) {
      console.warn('[API] Database connection failed:', connectionTest.message);
      return null;
    }

    // Get organization with stats
    const org = await organizationDAO.getWithStats(orgId);
    if (!org) {
      return null;
    }

    // Get applications
    const applications = await applicationDAO.findByOrganization(orgId);
    
    // Get recent breach alerts
    const breaches = await breachAlertDAO.findByOrganization(orgId, 5);

    // Transform to dashboard format
    return {
      id: org.id,
      name: org.name,
      type: org.type,
      employees: org.employees,
      industry: org.industry,
      website: org.website,
      scanResults: {
        totalApps: parseInt(org.total_apps) || 0,
        highRiskApps: parseInt(org.high_risk_apps) || 0,
        dataExposure: org.critical_findings || 0,
        privacyScore: org.privacy_score || 0,
        lastScan: org.last_scan_at || new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      recommendations: applications
        .filter(app => app.risk_level === 'high' || app.risk_level === 'critical')
        .map(app => `Review security settings for ${app.name}`)
        .slice(0, 4),
      breaches: breaches.map(breach => ({
        id: breach.id,
        service: breach.application_name || 'Unknown Service',
        date: breach.breach_date,
        severity: breach.severity,
        affectedData: breach.affected_data_types || []
      })),
      applications: applications,
      stats: {
        privacyScoreChange: org.privacy_score > 70 ? '+5' : org.privacy_score > 50 ? '+2' : '-3',
        newBreachesThisWeek: breaches.filter(b => 
          new Date(b.breach_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        appsScannedThisMonth: parseInt(org.total_apps) || 0,
        complianceStatus: org.privacy_score > 70 ? 'Good' : 
                         org.privacy_score > 50 ? 'Fair' : 'Needs Attention'
      },
      isConnectedToDatabase: true,
      demoMode: false
    };
  } catch (error) {
    console.error('[API] Database query failed:', error);
    return null;
  }
}

export default async function handler(req, res) {
  const { orgId } = req.query;
  
  // Handle CORS for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Initialize database connection if enabled
  if (isDatabaseEnabled && !database) {
    await initializeDatabase();
  }

  // Try database first, fall back to demo data
  let organization = null;
  
  if (isDatabaseEnabled) {
    console.log(`[API] Attempting to load organization ${orgId} from database...`);
    organization = await getOrganizationFromDatabase(orgId);
  }

  // Fall back to demo data if database fails or is disabled
  if (!organization) {
    console.log(`[API] Loading organization ${orgId} from demo data...`);
    const organizations = getDemoOrganizations();
    const demoOrg = organizations.find(org => org.id === orgId);
    
    if (!demoOrg) {
      return res.status(404).json({ 
        error: 'Organization not found',
        availableOrgs: organizations.map(org => ({
          id: org.id,
          name: org.name
        })),
        databaseEnabled: isDatabaseEnabled,
        demoMode: true
      });
    }

    // Add computed stats for demo data
    organization = {
      ...demoOrg,
      stats: {
        privacyScoreChange: '+5',
        newBreachesThisWeek: demoOrg.breaches?.filter(b => 
          new Date(b.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length || 0,
        appsScannedThisMonth: demoOrg.scanResults?.totalApps || 0,
        complianceStatus: demoOrg.scanResults?.privacyScore > 70 ? 'Good' : 
                         demoOrg.scanResults?.privacyScore > 50 ? 'Fair' : 'Needs Attention'
      },
      isConnectedToDatabase: false,
      demoMode: true
    };
  }

  res.status(200).json(organization);
}