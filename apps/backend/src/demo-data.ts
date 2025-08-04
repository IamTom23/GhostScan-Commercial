// Demo data seeder for GhostScan Business MVP
import { OrganizationProfile, UserProfile, SaaSApp } from './types/shared';

export const seedDemoOrganizations = (): OrganizationProfile[] => {
  return [
    {
      id: 'org_demo_startup',
      name: 'TechFlow Startup',
      domain: 'techflow.io',
      email: 'admin@techflow.io',
      industry: 'Technology',
      size: 'STARTUP',
      riskScore: 72,
      totalApps: 15,
      highRiskApps: 3,
      criticalApps: 1,
      employeeCount: 12,
      complianceRequirements: ['GDPR', 'CCPA'],
      preferences: {
        breachAlerts: true,
        weeklyReports: true,
        autoPrivacyRequests: false,
        complianceMonitoring: true,
      },
      lastScanDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      id: 'org_demo_smb',
      name: 'GrowthCorp SMB',
      domain: 'growthcorp.com',
      email: 'security@growthcorp.com',
      industry: 'Marketing',
      size: 'SMALL',
      riskScore: 58,
      totalApps: 28,
      highRiskApps: 5,
      criticalApps: 0,
      employeeCount: 45,
      complianceRequirements: ['GDPR'],
      preferences: {
        breachAlerts: true,
        weeklyReports: true,
        autoPrivacyRequests: true,
        complianceMonitoring: true,
      },
      lastScanDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    }
  ];
};

export const seedDemoUsers = (): UserProfile[] => {
  return [
    {
      id: 'user_demo_admin',
      email: 'admin@techflow.io',
      name: 'Sarah Chen',
      role: 'ADMIN',
      organizationId: 'org_demo_startup',
      permissions: ['read', 'write', 'admin', 'compliance'],
      lastLoginDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
    {
      id: 'user_demo_user',
      email: 'john@techflow.io',
      name: 'John Smith',
      role: 'USER',
      organizationId: 'org_demo_startup',
      permissions: ['read', 'write'],
      lastLoginDate: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    },
    {
      id: 'user_demo_smb_admin',
      email: 'security@growthcorp.com',
      name: 'Maria Rodriguez',
      role: 'ADMIN',
      organizationId: 'org_demo_smb',
      permissions: ['read', 'write', 'admin', 'compliance'],
      lastLoginDate: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    }
  ];
};

export const seedDemoApps = (): SaaSApp[] => {
  return [
    {
      id: 'app_slack_demo',
      name: 'Slack',
      domain: 'slack.com',
      category: 'COMMUNICATION',
      riskLevel: 'MEDIUM',
      dataTypes: ['messages', 'files', 'user_data', 'integrations'],
      hasBreaches: false,
      thirdPartySharing: true,
      lastAccessed: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      accountStatus: 'ACTIVE',
      passwordStrength: 'STRONG',
      employeeCount: 12,
      departments: ['Engineering', 'Marketing', 'Sales'],
      businessCritical: true,
      complianceImpact: ['GDPR'],
      contractDetails: {
        vendor: 'Slack Technologies',
        contractStart: new Date('2024-01-01'),
        contractEnd: new Date('2024-12-31'),
        cost: 8.75 * 12,
        dataProcessingAgreement: true
      }
    },
    {
      id: 'app_github_demo',
      name: 'GitHub',
      domain: 'github.com',
      category: 'DEVELOPMENT',
      riskLevel: 'HIGH',
      dataTypes: ['code', 'repositories', 'user_data', 'organization_data'],
      hasBreaches: false,
      thirdPartySharing: false,
      lastAccessed: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      accountStatus: 'ACTIVE',
      passwordStrength: 'STRONG',
      employeeCount: 8,
      departments: ['Engineering'],
      businessCritical: true,
      complianceImpact: ['GDPR'],
      contractDetails: {
        vendor: 'GitHub Inc',
        contractStart: new Date('2024-01-01'),
        contractEnd: new Date('2024-12-31'),
        cost: 4 * 8,
        dataProcessingAgreement: true
      }
    },
    {
      id: 'app_grammarly_demo',
      name: 'Grammarly',
      domain: 'grammarly.com',
      category: 'PRODUCTIVITY',
      riskLevel: 'CRITICAL',
      dataTypes: ['documents', 'writing_data', 'personal_information'],
      hasBreaches: true,
      thirdPartySharing: true,
      lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      accountStatus: 'ACTIVE',
      passwordStrength: 'WEAK',
      employeeCount: 5,
      departments: ['Marketing', 'Sales'],
      businessCritical: false,
      complianceImpact: ['GDPR', 'CCPA']
    },
    {
      id: 'app_figma_demo',
      name: 'Figma',
      domain: 'figma.com',
      category: 'DEVELOPMENT',
      riskLevel: 'LOW',
      dataTypes: ['design_files', 'user_data', 'project_data'],
      hasBreaches: false,
      thirdPartySharing: true,
      lastAccessed: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      accountStatus: 'ACTIVE',
      passwordStrength: 'STRONG',
      employeeCount: 6,
      departments: ['Design', 'Product'],
      businessCritical: false,
      complianceImpact: ['GDPR'],
      contractDetails: {
        vendor: 'Figma Inc',
        contractStart: new Date('2024-01-01'),
        contractEnd: new Date('2024-12-31'),
        cost: 12 * 6,
        dataProcessingAgreement: true
      }
    },
    {
      id: 'app_notion_demo',
      name: 'Notion',
      domain: 'notion.so',
      category: 'PRODUCTIVITY',
      riskLevel: 'MEDIUM',
      dataTypes: ['documents', 'databases', 'user_data', 'workspace_data'],
      hasBreaches: false,
      thirdPartySharing: false,
      lastAccessed: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      accountStatus: 'ACTIVE',
      passwordStrength: 'STRONG',
      employeeCount: 10,
      departments: ['Engineering', 'Product', 'Marketing'],
      businessCritical: true,
      complianceImpact: ['GDPR'],
      contractDetails: {
        vendor: 'Notion Labs',
        contractStart: new Date('2024-01-01'),
        contractEnd: new Date('2024-12-31'),
        cost: 10 * 10,
        dataProcessingAgreement: true
      }
    }
  ];
};

// Helper function to initialize demo data
export const initializeDemoData = () => {
  console.log('🚀 Initializing GhostScan Business demo data...');
  
  const organizations = seedDemoOrganizations();
  const users = seedDemoUsers();
  const apps = seedDemoApps();
  
  console.log(`📊 Demo data loaded:`);
  console.log(`   - ${organizations.length} organizations`);
  console.log(`   - ${users.length} users`);
  console.log(`   - ${apps.length} sample applications`);
  console.log(`✅ Demo data ready for testing!`);
  
  return { organizations, users, apps };
};