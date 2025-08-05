// Vercel serverless function for health check
export default function handler(req, res) {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'GhostScan Business API',
    version: '1.0.0-mvp',
    database: 'In-Memory (Demo)',
    platform: 'Vercel Serverless',
    features: {
      oauth: ['google', 'microsoft'],
      scanning: ['google-workspace', 'microsoft-365'],
      compliance: ['gdpr', 'ccpa'],
    },
  };
  
  res.status(200).json(healthData);
}