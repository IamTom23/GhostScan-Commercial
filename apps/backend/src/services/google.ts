import { google } from 'googleapis';
import { OAuthUser } from '../config/oauth';

export interface GoogleAppData {
  id: string;
  name: string;
  domain: string;
  permissions: string[];
  lastAccessed: Date;
  dataTypes: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class GoogleService {
  private oauth2Client: any;

  constructor(user: OAuthUser) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken
    });
  }

  async scanGoogleWorkspace(): Promise<GoogleAppData[]> {
    const apps: GoogleAppData[] = [];

    try {
      // Scan Gmail for connected apps
      const gmailApps = await this.scanGmailConnectedApps();
      apps.push(...gmailApps);

      // Scan Google Drive for third-party apps
      const driveApps = await this.scanDriveConnectedApps();
      apps.push(...driveApps);

      // Scan Google Calendar for connected apps
      const calendarApps = await this.scanCalendarConnectedApps();
      apps.push(...calendarApps);

      // Scan OAuth connections
      const oauthApps = await this.scanOAuthConnections();
      apps.push(...oauthApps);

    } catch (error) {
      console.error('Error scanning Google Workspace:', error);
    }

    return this.deduplicateApps(apps);
  }

  private async scanGmailConnectedApps(): Promise<GoogleAppData[]> {
    try {
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      
      // Get recent emails from various services to identify connected apps
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'from:(noreply OR no-reply OR notification) subject:(welcome OR account OR signin)',
        maxResults: 50
      });

      const apps: GoogleAppData[] = [];
      
      if (response.data.messages) {
        for (const message of response.data.messages.slice(0, 10)) {
          const messageData = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!
          });

          const headers = messageData.data.payload?.headers || [];
          const fromHeader = headers.find(h => h.name === 'From');
          const subjectHeader = headers.find(h => h.name === 'Subject');
          
          if (fromHeader?.value) {
            const domain = this.extractDomainFromEmail(fromHeader.value);
            const appName = this.extractAppNameFromDomain(domain);
            
            if (domain && appName && !apps.find(a => a.domain === domain)) {
              apps.push({
                id: `gmail_${domain}`,
                name: appName,
                domain,
                permissions: ['email_access'],
                lastAccessed: new Date(parseInt(messageData.data.internalDate || '0')),
                dataTypes: ['email', 'personal'],
                riskLevel: this.calculateRiskLevel(domain, ['email_access'])
              });
            }
          }
        }
      }

      return apps;
    } catch (error) {
      console.error('Error scanning Gmail:', error);
      return [];
    }
  }

  private async scanDriveConnectedApps(): Promise<GoogleAppData[]> {
    try {
      const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      
      // Get files that were created by third-party apps
      const response = await drive.files.list({
        q: "trashed=false",
        fields: 'files(id,name,createdTime,owners,parents)',
        pageSize: 100
      });

      const apps: GoogleAppData[] = [];
      
      if (response.data.files) {
        const appDomains = new Set<string>();
        
        for (const file of response.data.files) {
          // Look for files that might indicate third-party app usage
          if (file.name?.includes('Canva') || file.name?.includes('Figma') || file.name?.includes('Adobe')) {
            const appName = this.extractAppNameFromFileName(file.name);
            const domain = this.getDomainForApp(appName);
            
            if (domain && !appDomains.has(domain)) {
              appDomains.add(domain);
              apps.push({
                id: `drive_${domain}`,
                name: appName,
                domain,
                permissions: ['drive_access', 'file_creation'],
                lastAccessed: new Date(file.createdTime || Date.now()),
                dataTypes: ['files', 'documents', 'creative'],
                riskLevel: this.calculateRiskLevel(domain, ['drive_access'])
              });
            }
          }
        }
      }

      return apps;
    } catch (error) {
      console.error('Error scanning Google Drive:', error);
      return [];
    }
  }

  private async scanCalendarConnectedApps(): Promise<GoogleAppData[]> {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      // Get calendar events that might indicate third-party integrations
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime'
      });

      const apps: GoogleAppData[] = [];
      
      if (response.data.items) {
        const appDomains = new Set<string>();
        
        for (const event of response.data.items) {
          if (event.organizer?.email && !event.organizer.email.includes('gmail.com')) {
            const domain = this.extractDomainFromEmail(event.organizer.email);
            const appName = this.extractAppNameFromDomain(domain);
            
            if (domain && appName && !appDomains.has(domain)) {
              appDomains.add(domain);
              apps.push({
                id: `calendar_${domain}`,
                name: appName,
                domain,
                permissions: ['calendar_access'],
                lastAccessed: new Date(event.created || Date.now()),
                dataTypes: ['calendar', 'schedule', 'meetings'],
                riskLevel: this.calculateRiskLevel(domain, ['calendar_access'])
              });
            }
          }
        }
      }

      return apps;
    } catch (error) {
      console.error('Error scanning Google Calendar:', error);
      return [];
    }
  }

  private async scanOAuthConnections(): Promise<GoogleAppData[]> {
    // This would require additional Google Admin SDK access
    // For now, return mock data for common startup/SMB OAuth apps
    return [
      {
        id: 'oauth_slack',
        name: 'Slack',
        domain: 'slack.com',
        permissions: ['profile', 'email', 'workspace_access', 'files_write'],
        lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        dataTypes: ['profile', 'messages', 'files', 'integrations'],
        riskLevel: 'MEDIUM'
      },
      {
        id: 'oauth_github',
        name: 'GitHub',
        domain: 'github.com',
        permissions: ['profile', 'email', 'repo_access', 'organization_access'],
        lastAccessed: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        dataTypes: ['profile', 'code', 'repositories', 'organization_data'],
        riskLevel: 'HIGH'
      },
      {
        id: 'oauth_notion',
        name: 'Notion',
        domain: 'notion.so',
        permissions: ['profile', 'workspace_access', 'content_write'],
        lastAccessed: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        dataTypes: ['profile', 'documents', 'databases', 'workspace_data'],
        riskLevel: 'MEDIUM'
      },
      {
        id: 'oauth_figma',
        name: 'Figma',
        domain: 'figma.com',
        permissions: ['profile', 'team_access', 'file_access'],
        lastAccessed: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        dataTypes: ['profile', 'design_files', 'team_data', 'prototypes'],
        riskLevel: 'LOW'
      },
      {
        id: 'oauth_vercel',
        name: 'Vercel',
        domain: 'vercel.com',
        permissions: ['profile', 'team_access', 'deployment_access'],
        lastAccessed: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        dataTypes: ['profile', 'deployments', 'environment_variables', 'analytics'],
        riskLevel: 'HIGH'
      }
    ];
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
      'heroku.com': 'Heroku',
      
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
      'analytics.google.com': 'Google Analytics',
      'mixpanel.com': 'Mixpanel',
      'amplitude.com': 'Amplitude',
      'sentry.io': 'Sentry',
      
      // Storage & Backup
      'dropbox.com': 'Dropbox',
      'box.com': 'Box',
      'aws.amazon.com': 'Amazon Web Services',
      
      // Writing & Content
      'grammarly.com': 'Grammarly',
      'loom.com': 'Loom'
    };
    
    return domainMap[domain] || this.capitalizeFirstLetter(domain.split('.')[0]);
  }

  private extractAppNameFromFileName(fileName: string): string {
    if (fileName.toLowerCase().includes('canva')) return 'Canva';
    if (fileName.toLowerCase().includes('figma')) return 'Figma';
    if (fileName.toLowerCase().includes('adobe')) return 'Adobe Creative Cloud';
    return 'Unknown App';
  }

  private getDomainForApp(appName: string): string {
    const appMap: { [key: string]: string } = {
      'Canva': 'canva.com',
      'Figma': 'figma.com',
      'Adobe Creative Cloud': 'adobe.com'
    };
    
    return appMap[appName] || 'unknown.com';
  }

  private calculateRiskLevel(domain: string, permissions: string[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // Critical risk domains - can access sensitive business data
    const criticalRiskDomains = ['aws.amazon.com', 'console.cloud.google.com'];
    
    // High risk domains - development and business-critical tools
    const highRiskDomains = ['github.com', 'gitlab.com', 'stripe.com', 'grammarly.com', 'vercel.com', 'heroku.com'];
    
    // Medium risk domains - productivity and collaboration tools
    const mediumRiskDomains = ['slack.com', 'notion.so', 'asana.com', 'trello.com', 'canva.com', 'hubspot.com', 'airtable.com'];
    
    // Business-critical permissions
    const criticalPermissions = ['admin_access', 'full_access', 'organization_owner'];
    const highRiskPermissions = ['repo_access', 'workspace_admin', 'financial_data', 'deployment_access'];
    
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

  private deduplicateApps(apps: GoogleAppData[]): GoogleAppData[] {
    const uniqueApps = new Map<string, GoogleAppData>();
    
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