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
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: Date }>> {
    return this.request<{ status: string; timestamp: Date }>('/health');
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
        return {
          success: true,
          message: 'Backend API connected successfully',
          details: healthResult.data,
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

    // Action based on privacy score
    if (orgData.scanResults && orgData.scanResults.privacyScore < 70) {
      actions.push({
        id: 'improve-privacy-score',
        title: 'Improve Organization Privacy Score',
        description: `Your organization's privacy score is ${orgData.scanResults.privacyScore}. Implement recommended security measures.`,
        priority: 'HIGH',
        type: 'PRIVACY_IMPROVEMENT',
        estimatedTime: '2 hours',
        completed: false,
      });
    }

    // Action based on high-risk apps
    if (orgData.scanResults && orgData.scanResults.highRiskApps > 0) {
      actions.push({
        id: 'review-high-risk-apps',
        title: `Review ${orgData.scanResults.highRiskApps} High-Risk Applications`,
        description: 'Audit and secure high-risk applications used by your organization.',
        priority: 'HIGH',
        type: 'SECURITY_AUDIT',
        estimatedTime: '3 hours',
        completed: false,
      });
    }

    // Action based on breaches
    if (orgData.breaches && orgData.breaches.length > 0) {
      actions.push({
        id: 'address-breaches',
        title: `Address ${orgData.breaches.length} Security Breaches`,
        description: 'Implement security measures to address recent data breaches.',
        priority: 'CRITICAL',
        type: 'BREACH_RESPONSE',
        estimatedTime: '4 hours',
        completed: false,
      });
    }

    return actions;
  }

  private generatePrivacyTipsFromOrgData(orgData: OrganizationData) {
    const tips = [];

    // Tip based on organization type
    if (orgData.type === 'startup') {
      tips.push({
        id: 'startup-privacy-basics',
        title: 'Privacy Fundamentals for Startups',
        description: 'Establish core privacy practices early to build customer trust and ensure compliance.',
        category: 'COMPLIANCE',
        difficulty: 'MEDIUM',
        timeEstimate: '1 hour',
        completed: false,
      });
    }

    // Tip based on employee count
    if (orgData.employees > 50) {
      tips.push({
        id: 'employee-training',
        title: 'Privacy Training for Teams',
        description: 'Implement privacy awareness training for all employees to reduce security risks.',
        category: 'TRAINING',
        difficulty: 'HIGH',
        timeEstimate: '4 hours',
        completed: false,
      });
    }

    // Tip based on industry
    if (orgData.industry.toLowerCase().includes('tech') || orgData.industry.toLowerCase().includes('software')) {
      tips.push({
        id: 'tech-privacy-standards',
        title: 'Tech Industry Privacy Standards',
        description: 'Implement privacy-by-design principles in your software development lifecycle.',
        category: 'DEVELOPMENT',
        difficulty: 'HIGH',
        timeEstimate: '6 hours',
        completed: false,
      });
    }

    return tips;
  }
}

export const apiService = new ApiService();