// Production Configuration for GhostScan Dashboard

export const PRODUCTION_CONFIG = {
  // Dashboard URLs
  dashboardUrl: process.env.DASHBOARD_URL || 'https://ghostscan-dashboard.vercel.app',
  apiUrl: process.env.API_URL || 'https://ghostscan-dashboard.vercel.app',
  
  // Extension Configuration
  extensionId: process.env.EXTENSION_ID || 'lldnikolaejjojgiabojpfhmpaafeige', // Will be different in production
  
  // Database Configuration
  databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/ghostscan',
  
  // Analytics
  googleAnalyticsId: process.env.GA_ID || '',
  
  // Feature Flags
  features: {
    realTimeScanning: true,
    breachMonitoring: true,
    privacyRequests: true,
    aiInsights: true,
    userAccounts: true
  },
  
  // API Endpoints
  endpoints: {
    scan: '/api/scan',
    user: '/api/user',
    breaches: '/api/breaches',
    recommendations: '/api/recommendations',
    privacyRequests: '/api/privacy-requests'
  },
  
  // Security
  security: {
    corsOrigins: [
      'https://dashboard.ghostscan.com',
      'https://*.ghostscan.com',
      'https://ghostscan-dashboard.vercel.app',
      'https://*.vercel.app',
      'http://localhost:5173'
    ],
    maxScanDuration: 30000, // 30 seconds
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  }
};

// Environment Detection
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isStaging = process.env.NODE_ENV === 'staging';

// Get current configuration based on environment
export const getConfig = () => {
  if (isProduction) {
    return PRODUCTION_CONFIG;
  }
  
  // Development configuration
  return {
    ...PRODUCTION_CONFIG,
    dashboardUrl: 'http://localhost:5173',
    apiUrl: '', // Use relative URLs for Vite proxy
    databaseUrl: 'mongodb://localhost:27017/ghostscan-dev'
  };
};

export default getConfig(); 