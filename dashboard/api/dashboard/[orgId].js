// Vercel serverless function for organization dashboard data
// Demo version without database dependencies

// Demo data for MVP
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

export default function handler(req, res) {
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

  const organizations = getDemoOrganizations();
  const organization = organizations.find(org => org.id === orgId);
  
  if (!organization) {
    return res.status(404).json({ 
      error: 'Organization not found',
      availableOrgs: organizations.map(org => ({
        id: org.id,
        name: org.name
      }))
    });
  }

  // Add some computed stats for the dashboard
  const dashboardData = {
    ...organization,
    stats: {
      privacyScoreChange: '+5',
      newBreachesThisWeek: organization.breaches?.filter(b => 
        new Date(b.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0,
      appsScannedThisMonth: organization.scanResults?.totalApps || 0,
      complianceStatus: organization.scanResults?.privacyScore > 70 ? 'Good' : 
                       organization.scanResults?.privacyScore > 50 ? 'Fair' : 'Needs Attention'
    },
    isConnectedToDatabase: false,
    demoMode: true
  };

  res.status(200).json(dashboardData);
}