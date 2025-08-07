// Enhanced Vercel serverless function with real database integration
import { NextApiRequest, NextApiResponse } from 'next';
import { database, organizationDAO, applicationDAO, breachAlertDAO, securityScanDAO } from '../../lib/database';

// CORS headers for development
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Demo data fallback for when database is not available
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
      lastScan: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
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
      lastScan: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).setHeader('Access-Control-Allow-Origin', '*')
       .setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')  
       .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
       .end();
    return;
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgId } = req.query;

  if (!orgId || typeof orgId !== 'string') {
    return res.status(400).json({ error: 'Organization ID is required' });
  }

  try {
    // Try to connect to database first
    const connectionTest = await database.testConnection();
    
    if (connectionTest.success) {
      // Database is available - use real data
      console.log('[API] Using database for organization data:', orgId);
      
      try {
        // Check if orgId is a UUID (real org) or demo org
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orgId);
        
        let organizationData;
        
        if (isUuid) {
          // Real organization lookup
          organizationData = await organizationDAO.getWithStats(orgId);
        } else if (orgId.startsWith('org_demo_')) {
          // Demo organization - check if we have it in database, otherwise use fallback
          organizationData = await organizationDAO.findBySlug(orgId);
          
          if (!organizationData) {
            // Demo org not in database yet, use demo data and optionally seed database
            console.log('[API] Demo organization not found in database, using fallback data');
            return handleDemoDataResponse(req, res, orgId);
          }
        } else {
          // Try to find by slug
          organizationData = await organizationDAO.findBySlug(orgId);
        }

        if (!organizationData) {
          return res.status(404).json({
            error: 'Organization not found',
            message: `Organization with ID '${orgId}' does not exist`,
            isConnectedToDatabase: true
          });
        }

        // Fetch related data
        const [applications, breachAlerts, latestScan] = await Promise.all([
          applicationDAO.findByOrganization(organizationData.id),
          breachAlertDAO.findByOrganization(organizationData.id, 10),
          securityScanDAO.getLatestByOrganization(organizationData.id)
        ]);

        // Build enhanced dashboard data with real database information
        const dashboardData = {
          ...organizationData,
          stats: {
            privacyScoreChange: calculateScoreChange(organizationData.privacy_score),
            newBreachesThisWeek: breachAlerts.filter(b => 
              new Date(b.breach_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ).length,
            appsScannedThisMonth: applications.length,
            complianceStatus: getComplianceStatus(organizationData.privacy_score)
          },
          applications: applications.map(app => ({
            id: app.id,
            name: app.name,
            domain: app.domain,
            riskLevel: app.risk_level,
            category: app.category,
            cloudProvider: app.cloud_provider,
            openFindingsCount: app.open_findings_count,
            lastScanned: app.last_scanned_at
          })),
          breachAlerts: breachAlerts.map(alert => ({
            id: alert.id,
            title: alert.breach_title,
            service: alert.application_name || 'Unknown Service',
            date: alert.breach_date,
            severity: alert.severity,
            affectedData: alert.affected_data_types,
            status: alert.status,
            isNew: alert.status === 'new'
          })),
          lastScan: latestScan ? {
            id: latestScan.id,
            type: latestScan.scan_type,
            status: latestScan.status,
            completedAt: latestScan.completed_at,
            overallScore: latestScan.overall_score,
            criticalIssues: latestScan.critical_issues,
            highIssues: latestScan.high_issues
          } : null,
          scanResults: {
            totalApps: organizationData.total_apps || 0,
            highRiskApps: organizationData.high_risk_apps || 0,
            dataExposure: Math.max(0, 100 - (organizationData.privacy_score || 50)),
            privacyScore: organizationData.privacy_score || 50,
            lastScan: organizationData.last_scan_at || organizationData.created_at
          },
          isConnectedToDatabase: true,
          databaseStatus: connectionTest
        };

        return res.status(200).json(dashboardData);

      } catch (dbError) {
        console.error('[API] Database query error:', dbError);
        
        // Fallback to demo data if database query fails
        console.log('[API] Falling back to demo data due to database query error');
        return handleDemoDataResponse(req, res, orgId);
      }

    } else {
      // Database not available - use demo data
      console.log('[API] Database not available, using demo data:', connectionTest.message);
      return handleDemoDataResponse(req, res, orgId);
    }

  } catch (error) {
    console.error('[API] Unexpected error:', error);
    
    // Ultimate fallback to demo data
    return handleDemoDataResponse(req, res, orgId);
  }
}

// Handle demo data response
function handleDemoDataResponse(req: NextApiRequest, res: NextApiResponse, orgId: string) {
  const organizations = getDemoOrganizations();
  const organization = organizations.find(org => org.id === orgId);
  
  if (!organization) {
    return res.status(404).json({
      error: 'Organization not found',
      availableOrgs: organizations.map(org => ({
        id: org.id,
        name: org.name
      })),
      isConnectedToDatabase: false
    });
  }

  // Add computed stats for demo data
  const dashboardData = {
    ...organization,
    stats: {
      privacyScoreChange: '+5',
      newBreachesThisWeek: organization.breaches?.filter(b =>
        new Date(b.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0,
      appsScannedThisMonth: organization.scanResults?.totalApps || 0,
      complianceStatus: getComplianceStatus(organization.scanResults?.privacyScore || 50)
    },
    isConnectedToDatabase: false,
    demoMode: true
  };

  return res.status(200).json(dashboardData);
}

// Utility functions
function calculateScoreChange(currentScore: number): string {
  // Simulate score change calculation
  const change = Math.floor(Math.random() * 10) - 5; // Random change between -5 and +4
  return change >= 0 ? `+${change}` : `${change}`;
}

function getComplianceStatus(privacyScore: number): string {
  if (privacyScore > 80) return 'Excellent';
  if (privacyScore > 70) return 'Good'; 
  if (privacyScore > 50) return 'Fair';
  return 'Needs Attention';
}