// Shared types for GhostScan Business - Startup & SMB Privacy Management
export interface SaaSApp {
  id: string;
  name: string;
  domain: string;
  category: 'PRODUCTIVITY' | 'COMMUNICATION' | 'DEVELOPMENT' | 'MARKETING' | 'FINANCE' | 'HR' | 'SECURITY' | 'OTHER';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dataTypes: string[];
  hasBreaches: boolean;
  thirdPartySharing: boolean;
  lastAccessed: Date;
  oauthProvider?: string;
  accountStatus: 'ACTIVE' | 'INACTIVE' | 'UNKNOWN';
  passwordStrength: 'WEAK' | 'MEDIUM' | 'STRONG';
  isReused?: boolean;
  source?: string;
  employeeCount: number;
  departments: string[];
  businessCritical: boolean;
  complianceImpact: ('GDPR' | 'CCPA' | 'HIPAA' | 'SOX')[];
  contractDetails?: {
    vendor: string;
    contractStart: Date;
    contractEnd: Date;
    cost: number;
    dataProcessingAgreement: boolean;
  };
}

export interface ScanResult {
  organizationId: string;
  apps: SaaSApp[];
  totalRiskScore: number;
  complianceScore: number;
  recommendations: string[];
  criticalFindings: string[];
  timestamp: Date;
  scanType: 'QUICK' | 'COMPREHENSIVE' | 'COMPLIANCE' | 'CUSTOM';
  scopeDescription: string;
  errors?: string[];
  employeesScanned?: number;
  departmentsScanned?: string[];
}

export interface OrganizationProfile {
  id: string;
  name: string;
  domain: string;
  email: string;
  industry: string;
  size: 'STARTUP' | 'SMALL' | 'MEDIUM';
  riskScore: number;
  totalApps: number;
  highRiskApps: number;
  criticalApps: number;
  employeeCount: number;
  lastScanDate?: Date;
  complianceRequirements: ('GDPR' | 'CCPA' | 'HIPAA' | 'SOX')[];
  preferences: {
    breachAlerts: boolean;
    weeklyReports: boolean;
    autoPrivacyRequests: boolean;
    complianceMonitoring: boolean;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER' | 'VIEWER';
  organizationId: string;
  permissions: string[];
  lastLoginDate?: Date;
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
  username: string;
  foundVia: string;
  confidence: number;
  dataExposed: string[];
}

export interface PrivacyRequest {
  id: string;
  type: 'DELETE' | 'EXPORT' | 'OPT_OUT' | 'DATA_MAPPING' | 'COMPLIANCE_AUDIT';
  appId: string;
  organizationId: string;
  requestedBy: string;
  scope: 'ORGANIZATION' | 'DEPARTMENT' | 'SPECIFIC_USERS';
  affectedUsers?: string[];
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'REQUIRES_APPROVAL';
  businessJustification?: string;
  complianceRequirement?: 'GDPR' | 'CCPA' | 'HIPAA' | 'SOX';
  createdAt: Date;
  completedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface AIAssistantQuery {
  id: string;
  question: string;
  context: {
    organizationId: string;
    userId: string;
    department?: string;
    complianceContext?: string[];
    businessContext?: string;
  };
  category: 'COMPLIANCE' | 'RISK_ASSESSMENT' | 'VENDOR_ANALYSIS' | 'POLICY' | 'GENERAL';
  timestamp: Date;
}

export interface EmailScanResult {
  id: string;
  email: string;
  subscriptions: Array<{
    service: string;
    frequency: string;
    lastEmail: Date;
    category: string;
  }>;
  signups: Array<{
    service: string;
    signupDate: Date;
    status: string;
  }>;
}

// Utility function
export const calculateRiskScore = (apps: SaaSApp[]): number => {
  if (apps.length === 0) return 0;
  
  let totalScore = 0;
  
  for (const app of apps) {
    let appScore = 0;
    
    // Base risk level scoring
    switch (app.riskLevel) {
      case 'LOW': appScore += 10; break;
      case 'MEDIUM': appScore += 25; break;
      case 'HIGH': appScore += 50; break;
      case 'CRITICAL': appScore += 75; break;
    }
    
    // Additional risk factors
    if (app.hasBreaches) appScore += 20;
    if (app.thirdPartySharing) appScore += 15;
    if (app.passwordStrength === 'WEAK') appScore += 15;
    if (app.passwordStrength === 'MEDIUM') appScore += 5;
    if (app.isReused) appScore += 10;
    
    totalScore += appScore;
  }
  
  // Normalize to 0-100 scale
  return Math.min(100, Math.round(totalScore / Math.max(1, apps.length)));
};