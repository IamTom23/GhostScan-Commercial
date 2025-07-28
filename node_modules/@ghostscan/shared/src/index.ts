// GhostScan Personal - Shared Types and Utilities

export interface SaaSApp {
  id: string;
  name: string;
  domain: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dataTypes: string[];
  hasBreaches: boolean;
  thirdPartySharing: boolean;
  lastAccessed?: Date;
  oauthProvider?: string;
  accountStatus: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  passwordStrength?: 'WEAK' | 'MEDIUM' | 'STRONG';
  isReused?: boolean;
}

export interface ScanResult {
  apps: SaaSApp[];
  totalRiskScore: number;
  recommendations: string[];
  timestamp: Date;
  scanType: 'BROWSER' | 'EMAIL' | 'OAUTH' | 'COMPREHENSIVE';
}

export interface PrivacyRequest {
  id: string;
  type: 'DELETE' | 'EXPORT' | 'OPT_OUT';
  appId: string;
  userId: string;
  status: 'PENDING' | 'SENT' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  completedAt?: Date;
  response?: string;
}

export interface BreachAlert {
  id: string;
  appId: string;
  breachDate: Date;
  dataTypes: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  isNew: boolean;
}

export interface GhostProfile {
  id: string;
  platform: string;
  email: string;
  username?: string;
  foundVia: 'BREACH' | 'OAUTH' | 'EMAIL_SCAN' | 'SHADOW_PROFILE';
  confidence: number;
  dataExposed: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  riskScore: number;
  totalApps: number;
  highRiskApps: number;
  lastScanDate?: Date;
  preferences: {
    breachAlerts: boolean;
    weeklyReports: boolean;
    autoPrivacyRequests: boolean;
  };
}

export interface AIAssistantQuery {
  id: string;
  question: string;
  context: {
    appId?: string;
    scanResult?: ScanResult;
    userProfile?: UserProfile;
  };
  response?: string;
  timestamp: Date;
}

export interface EmailScanResult {
  id: string;
  email: string;
  subscriptions: {
    service: string;
    frequency: string;
    lastEmail: Date;
    category: string;
  }[];
  signups: {
    service: string;
    signupDate: Date;
    status: 'ACTIVE' | 'INACTIVE';
  }[];
}

// Utility functions
export const calculateRiskScore = (apps: SaaSApp[]): number => {
  return apps.reduce((score, app) => {
    const riskMultiplier = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4,
    };
    return score + riskMultiplier[app.riskLevel];
  }, 0);
};

export const getRiskColor = (riskLevel: string): string => {
  const colors = {
    LOW: '#10B981', // green
    MEDIUM: '#F59E0B', // yellow
    HIGH: '#EF4444', // red
    CRITICAL: '#7C2D12', // dark red
  };
  return colors[riskLevel as keyof typeof colors] || '#6B7280';
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};
