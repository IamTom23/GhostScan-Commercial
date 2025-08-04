import { GoogleService, GoogleAppData } from './google';
import { MicrosoftService, MicrosoftAppData } from './microsoft';
import { OAuthUser } from '../config/oauth';
import { SaaSApp, ScanResult } from '../types/shared';

export interface PlatformConnection {
  provider: string;
  user: OAuthUser;
  status: 'active' | 'expired' | 'error';
}

export class ScannerService {
  private connections: Map<string, PlatformConnection> = new Map();

  addConnection(user: OAuthUser) {
    this.connections.set(user.provider, {
      provider: user.provider,
      user,
      status: 'active'
    });
  }

  removeConnection(provider: string) {
    this.connections.delete(provider);
  }

  getConnections(): PlatformConnection[] {
    return Array.from(this.connections.values());
  }

  async performComprehensiveScan(): Promise<ScanResult> {
    const allApps: SaaSApp[] = [];
    const scanErrors: string[] = [];

    // Scan Google Workspace if connected
    if (this.connections.has('google')) {
      try {
        const googleService = new GoogleService(this.connections.get('google')!.user);
        const googleApps = await googleService.scanGoogleWorkspace();
        const convertedApps = googleApps.map(app => this.convertToSaaSApp(app, 'google'));
        allApps.push(...convertedApps);
        console.log(`Google scan completed: ${googleApps.length} apps found`);
      } catch (error) {
        console.error('Google scan failed:', error);
        scanErrors.push('Google Workspace scan failed');
        this.connections.get('google')!.status = 'error';
      }
    }

    // Scan Microsoft 365 if connected
    if (this.connections.has('microsoft')) {
      try {
        const microsoftService = new MicrosoftService(this.connections.get('microsoft')!.user);
        const microsoftApps = await microsoftService.scanMicrosoft365();
        const convertedApps = microsoftApps.map(app => this.convertToSaaSApp(app, 'microsoft'));
        allApps.push(...convertedApps);
        console.log(`Microsoft scan completed: ${microsoftApps.length} apps found`);
      } catch (error) {
        console.error('Microsoft scan failed:', error);
        scanErrors.push('Microsoft 365 scan failed');
        this.connections.get('microsoft')!.status = 'error';
      }
    }

    // Add additional platform scans here (Slack, Zoom, etc.)
    const additionalApps = await this.scanAdditionalPlatforms();
    allApps.push(...additionalApps);

    // Deduplicate apps across platforms
    const uniqueApps = this.deduplicateApps(allApps);

    // Calculate risk scores and generate recommendations
    const totalRiskScore = this.calculateTotalRiskScore(uniqueApps);
    const recommendations = this.generateRecommendations(uniqueApps);

    const scanResult: ScanResult = {
      organizationId: 'default_org', // Will be set by caller
      apps: uniqueApps,
      totalRiskScore,
      complianceScore: this.calculateComplianceScore(uniqueApps),
      recommendations,
      criticalFindings: this.generateCriticalFindings(uniqueApps),
      timestamp: new Date(),
      scanType: 'COMPREHENSIVE',
      scopeDescription: `Comprehensive scan of ${uniqueApps.length} applications`,
      employeesScanned: uniqueApps.reduce((sum, app) => sum + app.employeeCount, 0),
      departmentsScanned: [...new Set(uniqueApps.flatMap(app => app.departments))]
    };

    if (scanErrors.length > 0) {
      scanResult.errors = scanErrors;
    }

    return scanResult;
  }

  private async scanAdditionalPlatforms(): Promise<SaaSApp[]> {
    // This would include scans for platforms that don't require OAuth
    // Or platforms we can detect through other means
    const additionalApps: SaaSApp[] = [];

    // Mock business-focused apps commonly used by startups and SMBs
    const businessApps = [
      {
        id: 'common_slack',
        name: 'Slack',
        domain: 'slack.com',
        category: 'COMMUNICATION' as const,
        riskLevel: 'MEDIUM' as const,
        dataTypes: ['messages', 'files', 'user_data', 'integrations'],
        hasBreaches: false,
        thirdPartySharing: true,
        lastAccessed: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        accountStatus: 'ACTIVE' as const,
        passwordStrength: 'STRONG' as const,
        employeeCount: 25,
        departments: ['Engineering', 'Marketing', 'Sales'],
        businessCritical: true,
        complianceImpact: ['GDPR' as const],
        contractDetails: {
          vendor: 'Slack Technologies',
          contractStart: new Date('2024-01-01'),
          contractEnd: new Date('2024-12-31'),
          cost: 8.75 * 25, // per user per month
          dataProcessingAgreement: true
        }
      },
      {
        id: 'common_notion',
        name: 'Notion',
        domain: 'notion.so',
        category: 'PRODUCTIVITY' as const,
        riskLevel: 'MEDIUM' as const,
        dataTypes: ['documents', 'databases', 'user_data', 'workspace_data'],
        hasBreaches: false,
        thirdPartySharing: false,
        lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        accountStatus: 'ACTIVE' as const,
        passwordStrength: 'STRONG' as const,
        employeeCount: 15,
        departments: ['Engineering', 'Product'],
        businessCritical: true,
        complianceImpact: ['GDPR' as const],
        contractDetails: {
          vendor: 'Notion Labs',
          contractStart: new Date('2024-01-01'),
          contractEnd: new Date('2024-12-31'),
          cost: 10 * 15,
          dataProcessingAgreement: true
        }
      },
      {
        id: 'common_figma',
        name: 'Figma',
        domain: 'figma.com',
        category: 'DEVELOPMENT' as const,
        riskLevel: 'LOW' as const,
        dataTypes: ['design_files', 'user_data', 'project_data'],
        hasBreaches: false,
        thirdPartySharing: true,
        lastAccessed: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        accountStatus: 'ACTIVE' as const,
        passwordStrength: 'STRONG' as const,
        employeeCount: 8,
        departments: ['Design', 'Product'],
        businessCritical: false,
        complianceImpact: ['GDPR' as const]
      }
    ];

    additionalApps.push(...businessApps);

    return additionalApps;
  }

  private convertToSaaSApp(
    app: GoogleAppData | MicrosoftAppData, 
    source: string
  ): SaaSApp {
    return {
      id: app.id,
      name: app.name,
      domain: app.domain,
      category: this.categorizeApp(app.domain),
      riskLevel: app.riskLevel,
      dataTypes: app.dataTypes,
      hasBreaches: this.checkForKnownBreaches(app.domain),
      thirdPartySharing: this.checkThirdPartySharing(app.domain),
      lastAccessed: app.lastAccessed,
      accountStatus: 'ACTIVE',
      passwordStrength: this.estimatePasswordStrength(app.domain),
      oauthProvider: source === 'google' ? 'Google' : 'Microsoft',
      source,
      employeeCount: this.estimateEmployeeCount(app.domain),
      departments: this.estimateDepartments(app.domain),
      businessCritical: this.isBusinessCritical(app.domain),
      complianceImpact: this.getComplianceImpact(app.domain)
    };
  }

  private checkForKnownBreaches(domain: string): boolean {
    // Known breached domains - in production, this would query a breach database
    const breachedDomains = [
      'grammarly.com',
      'canva.com', // Had a breach in 2019
      'dropbox.com',
      'adobe.com'
    ];
    
    return breachedDomains.includes(domain);
  }

  private checkThirdPartySharing(domain: string): boolean {
    // Domains known to share data with third parties
    const sharingDomains = [
      'canva.com',
      'grammarly.com',
      'spotify.com',
      'figma.com'
    ];
    
    return sharingDomains.includes(domain);
  }

  private estimatePasswordStrength(domain: string): 'WEAK' | 'MEDIUM' | 'STRONG' {
    // This would be based on actual password analysis in production
    // For now, randomly assign based on domain reputation
    const weakDomains = ['grammarly.com'];
    const strongDomains = ['adobe.com', 'microsoft.com', 'google.com'];
    
    if (weakDomains.includes(domain)) return 'WEAK';
    if (strongDomains.includes(domain)) return 'STRONG';
    return 'MEDIUM';
  }

  private deduplicateApps(apps: SaaSApp[]): SaaSApp[] {
    const uniqueApps = new Map<string, SaaSApp>();
    
    for (const app of apps) {
      const existing = uniqueApps.get(app.domain);
      if (!existing || app.lastAccessed > existing.lastAccessed) {
        uniqueApps.set(app.domain, {
          ...app,
          dataTypes: existing ? [...new Set([...existing.dataTypes, ...app.dataTypes])] : app.dataTypes
        });
      }
    }
    
    return Array.from(uniqueApps.values());
  }

  private calculateTotalRiskScore(apps: SaaSApp[]): number {
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
  }

  private categorizeApp(domain: string): 'PRODUCTIVITY' | 'COMMUNICATION' | 'DEVELOPMENT' | 'MARKETING' | 'FINANCE' | 'HR' | 'SECURITY' | 'OTHER' {
    const categories = {
      'COMMUNICATION': ['slack.com', 'teams.microsoft.com', 'zoom.us', 'discord.com'],
      'PRODUCTIVITY': ['notion.so', 'asana.com', 'trello.com', 'monday.com', 'clickup.com'],
      'DEVELOPMENT': ['github.com', 'gitlab.com', 'figma.com', 'vercel.com', 'netlify.com'],
      'MARKETING': ['mailchimp.com', 'hubspot.com', 'canva.com', 'buffer.com'],
      'FINANCE': ['stripe.com', 'quickbooks.intuit.com', 'xero.com'],
      'HR': ['bamboohr.com', 'workday.com', 'lever.co'],
      'SECURITY': ['1password.com', 'okta.com', 'auth0.com']
    };

    for (const [category, domains] of Object.entries(categories)) {
      if (domains.includes(domain)) {
        return category as any;
      }
    }
    return 'OTHER';
  }

  private estimateEmployeeCount(domain: string): number {
    // Estimate based on app type and typical usage
    const highUsageApps = ['slack.com', 'teams.microsoft.com', 'google.com'];
    const mediumUsageApps = ['notion.so', 'asana.com', 'github.com'];
    
    if (highUsageApps.includes(domain)) return Math.floor(Math.random() * 50) + 10;
    if (mediumUsageApps.includes(domain)) return Math.floor(Math.random() * 20) + 5;
    return Math.floor(Math.random() * 10) + 1;
  }

  private estimateDepartments(domain: string): string[] {
    const deptMapping: { [key: string]: string[] } = {
      'slack.com': ['Engineering', 'Marketing', 'Sales', 'HR'],
      'github.com': ['Engineering'],
      'figma.com': ['Design', 'Product'],
      'hubspot.com': ['Marketing', 'Sales'],
      'notion.so': ['Engineering', 'Product', 'Marketing']
    };
    
    return deptMapping[domain] || ['General'];
  }

  private isBusinessCritical(domain: string): boolean {
    const criticalApps = ['slack.com', 'teams.microsoft.com', 'github.com', 'aws.amazon.com', 'google.com'];
    return criticalApps.includes(domain);
  }

  private getComplianceImpact(domain: string): ('GDPR' | 'CCPA' | 'HIPAA' | 'SOX')[] {
    // Most business apps have GDPR implications due to personal data processing
    const baseCompliance: ('GDPR' | 'CCPA' | 'HIPAA' | 'SOX')[] = ['GDPR'];
    
    // Add specific compliance requirements
    if (['stripe.com', 'quickbooks.intuit.com'].includes(domain)) {
      baseCompliance.push('SOX');
    }
    
    if (['bamboohr.com'].includes(domain)) {
      baseCompliance.push('CCPA');
    }
    
    return baseCompliance;
  }

  private calculateComplianceScore(apps: SaaSApp[]): number {
    if (apps.length === 0) return 100;
    
    let complianceScore = 100;
    
    for (const app of apps) {
      // Deduct points for compliance issues
      if (app.riskLevel === 'CRITICAL') complianceScore -= 15;
      if (app.riskLevel === 'HIGH') complianceScore -= 10;
      if (app.hasBreaches) complianceScore -= 8;
      if (app.thirdPartySharing && !app.contractDetails?.dataProcessingAgreement) complianceScore -= 5;
      if (app.passwordStrength === 'WEAK') complianceScore -= 3;
    }
    
    return Math.max(0, Math.round(complianceScore));
  }

  private generateCriticalFindings(apps: SaaSApp[]): string[] {
    const findings: string[] = [];
    
    const criticalApps = apps.filter(app => app.riskLevel === 'CRITICAL');
    const breachedApps = apps.filter(app => app.hasBreaches);
    const noDpaApps = apps.filter(app => app.thirdPartySharing && !app.contractDetails?.dataProcessingAgreement);
    
    if (criticalApps.length > 0) {
      findings.push(`${criticalApps.length} CRITICAL risk applications require immediate attention`);
    }
    
    if (breachedApps.length > 0) {
      findings.push(`${breachedApps.length} applications have known data breaches`);
    }
    
    if (noDpaApps.length > 0) {
      findings.push(`${noDpaApps.length} vendors lack Data Processing Agreements`);
    }
    
    return findings;
  }

  private generateRecommendations(apps: SaaSApp[]): string[] {
    const recommendations: string[] = [];
    
    const breachedApps = apps.filter(app => app.hasBreaches);
    const weakPasswordApps = apps.filter(app => app.passwordStrength === 'WEAK');
    const highRiskApps = apps.filter(app => app.riskLevel === 'HIGH' || app.riskLevel === 'CRITICAL');
    const sharingApps = apps.filter(app => app.thirdPartySharing);
    const criticalApps = apps.filter(app => app.businessCritical);
    const noDpaApps = apps.filter(app => app.thirdPartySharing && !app.contractDetails?.dataProcessingAgreement);
    
    if (breachedApps.length > 0) {
      recommendations.push(`Immediately review ${breachedApps.length} applications with known data breaches`);
    }
    
    if (weakPasswordApps.length > 0) {
      recommendations.push(`Enforce strong password policy for ${weakPasswordApps.length} accounts`);
    }
    
    if (highRiskApps.length > 0) {
      recommendations.push(`Conduct security review for ${highRiskApps.length} high-risk applications`);
    }
    
    if (noDpaApps.length > 0) {
      recommendations.push(`Establish Data Processing Agreements with ${noDpaApps.length} vendors`);
    }
    
    if (criticalApps.length > 0) {
      recommendations.push(`Implement enhanced monitoring for ${criticalApps.length} business-critical applications`);
    }
    
    recommendations.push('Deploy organization-wide SSO and MFA policies');
    recommendations.push('Establish regular vendor risk assessment process');
    recommendations.push('Create incident response plan for third-party breaches');
    
    return recommendations;
  }
}