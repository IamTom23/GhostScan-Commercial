// Root API endpoint for Cloudyx Security Dashboard
export default function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiInfo = {
    name: 'Cloudyx Security Dashboard API',
    version: '1.0.0',
    description: 'SMB-focused cloud security scanning and compliance platform',
    endpoints: {
      health: '/api/health',
      organizations: '/api/dashboard/{orgId}',
      demo: {
        startup: '/api/dashboard/org_demo_startup',
        smb: '/api/dashboard/org_demo_smb'
      }
    },
    status: 'operational',
    timestamp: new Date().toISOString(),
    mode: 'demo'
  };

  res.status(200).json(apiInfo);
}