// Health check endpoint for Cloudyx Security Dashboard
import { NextApiRequest, NextApiResponse } from 'next';
import { database } from '../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    checks: {}
  };

  let statusCode = 200;

  try {
    // Test database connection
    const dbTest = await database.testConnection();
    
    healthCheck.checks.database = {
      status: dbTest.success ? 'healthy' : 'unhealthy',
      message: dbTest.message,
      responseTime: Date.now(),
      details: dbTest.details
    };

    // Test environment variables
    const requiredEnvVars = ['DATABASE_HOST', 'DATABASE_NAME'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    healthCheck.checks.environment = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'warning',
      message: missingEnvVars.length === 0 
        ? 'All required environment variables are set'
        : `Missing environment variables: ${missingEnvVars.join(', ')}`,
      missingVariables: missingEnvVars
    };

    // Test memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    healthCheck.checks.memory = {
      status: memUsageMB.heapUsed < 500 ? 'healthy' : 'warning',
      message: `Heap usage: ${memUsageMB.heapUsed}MB`,
      details: memUsageMB
    };

    // Overall health determination
    const unhealthyChecks = Object.values(healthCheck.checks)
      .filter(check => check.status === 'unhealthy');
    
    if (unhealthyChecks.length > 0) {
      healthCheck.status = 'unhealthy';
      statusCode = 503;
    } else {
      const warningChecks = Object.values(healthCheck.checks)
        .filter(check => check.status === 'warning');
      
      if (warningChecks.length > 0) {
        healthCheck.status = 'warning';
        statusCode = 200; // Still operational
      }
    }

  } catch (error) {
    console.error('[Health Check] Error during health check:', error);
    
    healthCheck.status = 'unhealthy';
    healthCheck.checks.system = {
      status: 'unhealthy',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : String(error)
    };
    
    statusCode = 503;
  }

  return res.status(statusCode).json(healthCheck);
}