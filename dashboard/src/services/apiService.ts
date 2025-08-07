// API Service - Connects dashboard with backend API
import config from '../config/production';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface OrganizationData {
  id: string;
  name: string;
  type: 'startup' | 'smb' | 'enterprise';
  employees: number;
  industry: string;
  website: string;
  scanResults?: {
    totalApps: number;
    highRiskApps: number;
    dataExposure: number;
    privacyScore: number;
    lastScan: Date;
  };
  recommendations?: string[];
  breaches?: Array<{
    id: string;
    service: string;
    date: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedData: string[];
  }>;
}

class ApiService {
  private baseUrl: string;
  private debugMode = true;

  constructor() {
    this.baseUrl = config.apiUrl;
    this.log('ApiService initialized with baseUrl:', this.baseUrl);
  }

  private log(message: string, data?: any) {
    if (this.debugMode) {
      console.log(`[ApiService] ${message}`, data || '');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      this.log(`Making ${options.method || 'GET'} request to:`, url);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.log('API response:', data);

      return {
        success: true,
        data,
      };
    } catch (error) {
      this.log('API request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get organization data
  async getOrganization(orgId: string): Promise<ApiResponse<OrganizationData>> {
    return this.request<OrganizationData>(`/api/dashboard/${orgId}`);
  }

  // Get demo startup organization
  async getDemoStartup(): Promise<ApiResponse<OrganizationData>> {
    return this.request<OrganizationData>('/api/dashboard/org_demo_startup');
  }

  // Get demo SMB organization
  async getDemoSMB(): Promise<ApiResponse<OrganizationData>> {
    return this.request<OrganizationData>('/api/dashboard/org_demo_smb');
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/health');
  }

  // Get API info
  async getApiInfo(): Promise<ApiResponse<any>> {
    return this.request<any>('/api');
  }

  // Test backend connection
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    details: any;
  }> {
    try {
      const healthResult = await this.healthCheck();
      
      if (healthResult.success) {
        const healthData = healthResult.data;
        
        return {
          success: true,
          message: healthData?.checks?.database?.status === 'healthy' 
            ? 'Backend API and database connected successfully'
            : 'Backend API connected, but database may have issues',
          details: {
            ...healthResult.data,
            databaseStatus: healthData?.checks?.database?.status || 'unknown',
            databaseMessage: healthData?.checks?.database?.message || 'No database info'
          },
        };
      } else {
        return {
          success: false,
          message: `Backend API connection failed: ${healthResult.error}`,
          details: { error: healthResult.error },
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Backend API connection test failed: ${error}`,
        details: { error: String(error) },
      };
    }
  }

  // Convert API organization data to dashboard format
  convertOrganizationToDashboardFormat(orgData: OrganizationData) {
    this.log('Converting organization data to dashboard format:', orgData);

    if (!orgData) {
      this.log('No organization data provided');
      return null;
    }

    return {
      userProfile: {
        id: orgData.id,
        email: `contact@${orgData.website || 'example.com'}`,
        riskScore: orgData.scanResults?.dataExposure || 0,
        totalApps: orgData.scanResults?.totalApps || 0,
        highRiskApps: orgData.scanResults?.highRiskApps || 0,
        lastScanDate: orgData.scanResults?.lastScan ? new Date(orgData.scanResults.lastScan) : new Date(),
        organization: {
          name: orgData.name,
          type: orgData.type,
          employees: orgData.employees,
          industry: orgData.industry,
          website: orgData.website,
        },
        preferences: {
          breachAlerts: true,
          weeklyReports: true,
          autoPrivacyRequests: false,
        },
      },
      apps: [], // Will be populated from scan results
      breachAlerts: orgData.breaches?.map(breach => ({
        id: breach.id,
        appId: breach.service,
        breachDate: new Date(breach.date),
        dataTypes: breach.affectedData,
        severity: breach.severity.toUpperCase() as 'MEDIUM' | 'LOW' | 'HIGH' | 'CRITICAL',
        description: `Data breach in ${breach.service}`,
        isNew: true,
      })) || [],
      recommendations: orgData.recommendations || [],
      privacyScore: orgData.scanResults?.privacyScore || 50,
      actions: this.generateActionsFromOrgData(orgData),
      privacyTips: this.generatePrivacyTipsFromOrgData(orgData),
    };
  }

  private generateActionsFromOrgData(orgData: OrganizationData) {
    const actions = [];

    // Realistic action items based on common security needs
    actions.push({
      id: 'enable-mfa',
      title: 'Enable Multi-Factor Authentication',
      description: 'Set up MFA on critical applications like Google Workspace, Slack, and GitHub to prevent account takeovers.',
      priority: 'HIGH',
      type: 'SECURITY_HARDENING',
      estimatedTime: '45 minutes',
      completed: false,
    });

    actions.push({
      id: 'review-oauth-permissions',
      title: 'Audit OAuth Application Permissions',
      description: 'Review third-party app connections and revoke access for unused or suspicious applications.',
      priority: 'MEDIUM',
      type: 'ACCESS_REVIEW',
      estimatedTime: '30 minutes',
      completed: false,
    });

    actions.push({
      id: 'update-privacy-policy',
      title: 'Update Privacy Policy for GDPR Compliance',
      description: 'Ensure your privacy policy covers data collection, processing, and user rights under GDPR.',
      priority: 'MEDIUM',
      type: 'COMPLIANCE_UPDATE',
      estimatedTime: '2 hours',
      completed: false,
    });

    // Add breach response if there are breaches
    if (orgData.breaches && orgData.breaches.length > 0) {
      actions.push({
        id: 'breach-response',
        title: `Respond to ${orgData.breaches.length} Data Breach${orgData.breaches.length > 1 ? 'es' : ''}`,
        description: 'Reset passwords, notify affected users, and document incident response steps.',
        priority: 'CRITICAL',
        type: 'INCIDENT_RESPONSE',
        estimatedTime: '1 hour',
        completed: false,
      });
    }

    return actions;
  }

  private generatePrivacyTipsFromOrgData(orgData: OrganizationData) {
    const tips = [];

    // Practical, actionable tips for all organizations
    tips.push({
      id: 'password-manager',
      title: 'Implement Enterprise Password Manager',
      description: 'Deploy a business password manager like 1Password Business or Bitwarden to ensure all employees use unique, strong passwords.',
      category: 'SECURITY',
      difficulty: 'EASY',
      timeEstimate: '2 hours',
      completed: false,
    });

    tips.push({
      id: 'access-review-process',
      title: 'Establish Quarterly Access Reviews',
      description: 'Set up a recurring process to review who has access to what applications and remove unnecessary permissions.',
      category: 'ACCESS_MANAGEMENT',
      difficulty: 'MEDIUM',
      timeEstimate: '3 hours',
      completed: false,
    });

    tips.push({
      id: 'data-processing-agreements',
      title: 'Audit Vendor Data Processing Agreements',
      description: 'Ensure all SaaS vendors have signed data processing agreements that specify how they handle your data.',
      category: 'COMPLIANCE',
      difficulty: 'MEDIUM',
      timeEstimate: '4 hours',
      completed: false,
    });

    // Additional tip for larger organizations
    if (orgData.employees > 25) {
      tips.push({
        id: 'security-awareness-training',
        title: 'Deploy Security Awareness Training',
        description: 'Implement regular security training to help employees recognize phishing, social engineering, and other threats.',
        category: 'TRAINING',
        difficulty: 'MEDIUM',
        timeEstimate: '1 hour setup + ongoing',
        completed: false,
      });
    }

    return tips;
  }
}

export const apiService = new ApiService();