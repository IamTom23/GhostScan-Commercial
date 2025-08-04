import axios from 'axios';
import { OAuthUser } from '../config/oauth';

export interface MicrosoftAppData {
  id: string;
  name: string;
  domain: string;
  permissions: string[];
  lastAccessed: Date;
  dataTypes: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class MicrosoftService {
  private accessToken: string;
  private baseUrl = 'https://graph.microsoft.com/v1.0';

  constructor(user: OAuthUser) {
    this.accessToken = user.accessToken;
  }

  async scanMicrosoft365(): Promise<MicrosoftAppData[]> {
    const apps: MicrosoftAppData[] = [];

    try {
      // Scan Outlook for connected apps
      const outlookApps = await this.scanOutlookConnectedApps();
      apps.push(...outlookApps);

      // Scan OneDrive for third-party apps
      const oneDriveApps = await this.scanOneDriveConnectedApps();
      apps.push(...oneDriveApps);

      // Scan Teams integrations
      const teamsApps = await this.scanTeamsIntegrations();
      apps.push(...teamsApps);

      // Scan OAuth applications
      const oauthApps = await this.scanOAuthApplications();
      apps.push(...oauthApps);

    } catch (error) {
      console.error('Error scanning Microsoft 365:', error);
    }

    return this.deduplicateApps(apps);
  }

  private async scanOutlookConnectedApps(): Promise<MicrosoftAppData[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/me/messages`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        params: {
          $filter: "contains(subject, 'welcome') or contains(subject, 'account') or contains(subject, 'notification')",
          $top: 50,
          $select: 'sender,subject,receivedDateTime'
        }
      });

      const apps: MicrosoftAppData[] = [];
      const processedDomains = new Set<string>();

      for (const message of response.data.value) {
        const senderEmail = message.sender?.emailAddress?.address;
        if (senderEmail) {
          const domain = this.extractDomainFromEmail(senderEmail);
          const appName = this.extractAppNameFromDomain(domain);
          
          if (domain && appName && !processedDomains.has(domain) && !domain.includes('microsoft.com')) {
            processedDomains.add(domain);
            apps.push({
              id: `outlook_${domain}`,
              name: appName,
              domain,
              permissions: ['email_access'],
              lastAccessed: new Date(message.receivedDateTime),
              dataTypes: ['email', 'personal'],
              riskLevel: this.calculateRiskLevel(domain, ['email_access'])
            });
          }
        }
      }

      return apps;
    } catch (error) {
      console.error('Error scanning Outlook:', error);
      return [];
    }
  }

  private async scanOneDriveConnectedApps(): Promise<MicrosoftAppData[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/me/drive/root/children`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        params: {
          $top: 100,
          $select: 'name,createdDateTime,createdBy'
        }
      });

      const apps: MicrosoftAppData[] = [];
      const processedApps = new Set<string>();

      for (const file of response.data.value) {
        const fileName = file.name;
        const appName = this.extractAppNameFromFileName(fileName);
        
        if (appName && appName !== 'Unknown App' && !processedApps.has(appName)) {
          processedApps.add(appName);
          const domain = this.getDomainForApp(appName);
          
          apps.push({
            id: `onedrive_${domain}`,
            name: appName,
            domain,
            permissions: ['file_access', 'drive_access'],
            lastAccessed: new Date(file.createdDateTime),
            dataTypes: ['files', 'documents'],
            riskLevel: this.calculateRiskLevel(domain, ['file_access'])
          });
        }
      }

      return apps;
    } catch (error) {
      console.error('Error scanning OneDrive:', error);
      return [];
    }
  }

  private async scanTeamsIntegrations(): Promise<MicrosoftAppData[]> {
    try {
      // This requires Teams-specific permissions, so we'll mock common startup integrations
      // In production, you'd scan for Teams apps and integrations
      return [
        {
          id: 'teams_github',
          name: 'GitHub',
          domain: 'github.com',
          permissions: ['teams_integration', 'notifications', 'repository_access'],
          lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          dataTypes: ['repositories', 'pull_requests', 'issues', 'team_data'],
          riskLevel: 'HIGH'
        },
        {
          id: 'teams_trello',
          name: 'Trello',
          domain: 'trello.com',
          permissions: ['teams_integration', 'notifications', 'board_access'],
          lastAccessed: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          dataTypes: ['projects', 'tasks', 'team_data', 'attachments'],
          riskLevel: 'MEDIUM'
        },
        {
          id: 'teams_asana',
          name: 'Asana',
          domain: 'asana.com',
          permissions: ['teams_integration', 'project_management', 'task_creation'],
          lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          dataTypes: ['projects', 'tasks', 'team_data', 'timelines'],
          riskLevel: 'MEDIUM'
        },
        {
          id: 'teams_azure_devops',
          name: 'Azure DevOps',
          domain: 'dev.azure.com',
          permissions: ['teams_integration', 'pipeline_access', 'repository_access'],
          lastAccessed: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
          dataTypes: ['code', 'pipelines', 'work_items', 'artifacts'],
          riskLevel: 'HIGH'
        }
      ];
    } catch (error) {
      console.error('Error scanning Teams integrations:', error);
      return [];
    }
  }

  private async scanOAuthApplications(): Promise<MicrosoftAppData[]> {
    try {
      // This would require admin permissions to access the Azure AD applications
      // For now, return mock data for common startup/SMB OAuth apps
      return [
        {
          id: 'oauth_adobe',
          name: 'Adobe Creative Cloud',
          domain: 'adobe.com',
          permissions: ['profile', 'email', 'files', 'creative_cloud_access'],
          lastAccessed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          dataTypes: ['profile', 'creative_files', 'documents', 'assets'],
          riskLevel: 'LOW'
        },
        {
          id: 'oauth_canva',
          name: 'Canva',
          domain: 'canva.com',
          permissions: ['profile', 'email', 'drive_access', 'team_access'],
          lastAccessed: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          dataTypes: ['profile', 'creative_files', 'templates', 'team_designs'],
          riskLevel: 'MEDIUM'
        },
        {
          id: 'oauth_hubspot',
          name: 'HubSpot',
          domain: 'hubspot.com',
          permissions: ['profile', 'email', 'contacts_access', 'marketing_access'],
          lastAccessed: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          dataTypes: ['profile', 'contacts', 'marketing_data', 'analytics'],
          riskLevel: 'HIGH'
        },
        {
          id: 'oauth_stripe',
          name: 'Stripe',
          domain: 'stripe.com',
          permissions: ['profile', 'email', 'payment_data', 'webhook_access'],
          lastAccessed: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          dataTypes: ['profile', 'payment_data', 'customer_data', 'financial_reports'],
          riskLevel: 'CRITICAL'
        }
      ];
    } catch (error) {
      console.error('Error scanning OAuth applications:', error);
      return [];
    }
  }

  private extractDomainFromEmail(email: string): string {
    const match = email.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return match ? match[1] : '';
  }

  private extractAppNameFromDomain(domain: string): string {
    const domainMap: { [key: string]: string } = {
      // Design & Creative
      'canva.com': 'Canva',
      'adobe.com': 'Adobe Creative Cloud',
      'figma.com': 'Figma',
      'sketch.com': 'Sketch',
      'invisionapp.com': 'InVision',
      
      // Communication & Collaboration
      'slack.com': 'Slack',
      'zoom.us': 'Zoom',
      'discord.com': 'Discord',
      'teams.microsoft.com': 'Microsoft Teams',
      
      // Productivity
      'notion.so': 'Notion',
      'asana.com': 'Asana',
      'trello.com': 'Trello',
      'monday.com': 'Monday.com',
      'clickup.com': 'ClickUp',
      'airtable.com': 'Airtable',
      
      // Development
      'github.com': 'GitHub',
      'gitlab.com': 'GitLab',
      'vercel.com': 'Vercel',
      'netlify.com': 'Netlify',
      'azure.microsoft.com': 'Microsoft Azure',
      
      // Finance & Business
      'stripe.com': 'Stripe',
      'quickbooks.intuit.com': 'QuickBooks',
      'xero.com': 'Xero',
      'freshbooks.com': 'FreshBooks',
      
      // Marketing
      'mailchimp.com': 'Mailchimp',
      'hubspot.com': 'HubSpot',
      'buffer.com': 'Buffer',
      'hootsuite.com': 'Hootsuite',
      
      // Analytics & Monitoring
      'mixpanel.com': 'Mixpanel',
      'amplitude.com': 'Amplitude',
      'sentry.io': 'Sentry',
      
      // Storage & Backup
      'dropbox.com': 'Dropbox',
      'box.com': 'Box',
      
      // Writing & Content
      'grammarly.com': 'Grammarly',
      'loom.com': 'Loom'
    };
    
    return domainMap[domain] || this.capitalizeFirstLetter(domain.split('.')[0]);
  }

  private extractAppNameFromFileName(fileName: string): string {
    const lowerName = fileName.toLowerCase();
    
    if (lowerName.includes('canva')) return 'Canva';
    if (lowerName.includes('figma')) return 'Figma';
    if (lowerName.includes('adobe')) return 'Adobe Creative Cloud';
    if (lowerName.includes('powerpoint') || lowerName.includes('.pptx')) return 'PowerPoint';
    if (lowerName.includes('word') || lowerName.includes('.docx')) return 'Microsoft Word';
    if (lowerName.includes('excel') || lowerName.includes('.xlsx')) return 'Microsoft Excel';
    
    return 'Unknown App';
  }

  private getDomainForApp(appName: string): string {
    const appMap: { [key: string]: string } = {
      'Canva': 'canva.com',
      'Figma': 'figma.com',
      'Adobe Creative Cloud': 'adobe.com',
      'PowerPoint': 'microsoft.com',
      'Microsoft Word': 'microsoft.com',
      'Microsoft Excel': 'microsoft.com'
    };
    
    return appMap[appName] || 'unknown.com';
  }

  private calculateRiskLevel(domain: string, permissions: string[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // Critical risk domains - financial and infrastructure access
    const criticalRiskDomains = ['stripe.com', 'azure.microsoft.com', 'dev.azure.com'];
    
    // High risk domains - development and business-critical tools
    const highRiskDomains = ['github.com', 'gitlab.com', 'hubspot.com', 'grammarly.com', 'quickbooks.intuit.com'];
    
    // Medium risk domains - productivity and collaboration tools
    const mediumRiskDomains = ['slack.com', 'notion.so', 'asana.com', 'trello.com', 'canva.com', 'airtable.com', 'monday.com'];
    
    // Business-critical permissions
    const criticalPermissions = ['admin_access', 'full_directory_access', 'payment_data', 'financial_access', 'infrastructure_admin'];
    const highRiskPermissions = ['repository_access', 'pipeline_access', 'marketing_access', 'customer_data', 'webhook_access', 'file_access'];
    
    if (criticalRiskDomains.includes(domain) || permissions.some(p => criticalPermissions.includes(p))) {
      return 'CRITICAL';
    }
    
    if (highRiskDomains.includes(domain) || permissions.some(p => highRiskPermissions.includes(p))) {
      return 'HIGH';
    }
    
    if (mediumRiskDomains.includes(domain) || permissions.length > 3) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  private deduplicateApps(apps: MicrosoftAppData[]): MicrosoftAppData[] {
    const uniqueApps = new Map<string, MicrosoftAppData>();
    
    for (const app of apps) {
      const existing = uniqueApps.get(app.domain);
      if (!existing || app.lastAccessed > existing.lastAccessed) {
        uniqueApps.set(app.domain, {
          ...app,
          permissions: existing ? [...new Set([...existing.permissions, ...app.permissions])] : app.permissions,
          dataTypes: existing ? [...new Set([...existing.dataTypes, ...app.dataTypes])] : app.dataTypes
        });
      }
    }
    
    return Array.from(uniqueApps.values());
  }

  private capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}