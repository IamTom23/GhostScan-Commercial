// Vercel serverless function for API info
export default function handler(req, res) {
  res.status(200).json({
    name: 'GhostScan Business API',
    description: 'Privacy & Security Management for Startups and SMBs',
    version: '1.0.0-mvp',
    platform: 'Vercel Serverless',
    endpoints: {
      health: 'GET /api/health',
      dashboard: 'GET /api/dashboard/[orgId]',
      demo: {
        startup: 'GET /api/dashboard/org_demo_startup',
        smb: 'GET /api/dashboard/org_demo_smb',
      }
    },
    demo_organizations: [
      {
        id: 'org_demo_startup',
        name: 'TechFlow Startup',
        domain: 'techflow.io',
        size: 'STARTUP'
      },
      {
        id: 'org_demo_smb',
        name: 'GrowthCorp SMB',
        domain: 'growthcorp.com',
        size: 'SMALL'
      }
    ]
  });
}