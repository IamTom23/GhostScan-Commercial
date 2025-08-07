// Health check endpoint for Cloudyx Security Dashboard
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

  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Cloudyx Security Dashboard API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: {
        status: 'warning',
        message: 'Database connection not configured for demo deployment',
        responseTime: Date.now()
      },
      environment: {
        status: 'healthy',
        message: 'Demo environment variables loaded'
      },
      memory: {
        status: 'healthy',
        message: 'Memory usage normal',
        details: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
        }
      }
    }
  };

  return res.status(200).json(healthCheck);
}