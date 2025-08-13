// OAuth Integration Service for Cloudyx Dashboard
// Handles Google Workspace and Microsoft 365 OAuth connections

interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
}

interface OAuthProvider {
  name: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  config: OAuthConfig;
}

interface ConnectedApp {
  id: string;
  name: string;
  provider: 'google' | 'microsoft';
  scopes: string[];
  permissions: string[];
  lastAccessed: Date;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  dataAccess: string[];
}

class OAuthService {
  private readonly providers: Record<string, OAuthProvider> = {
    google: {
      name: 'Google Workspace',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      config: {
        clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'demo-client-id',
        redirectUri: `${window.location.origin}/oauth/callback`,
        scope: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/admin.directory.readonly',
          'https://www.googleapis.com/auth/drive.readonly'
        ]
      }
    },
    microsoft: {
      name: 'Microsoft 365',
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
      config: {
        clientId: process.env.REACT_APP_MICROSOFT_CLIENT_ID || 'demo-client-id',
        redirectUri: `${window.location.origin}/oauth/callback`,
        scope: [
          'User.Read',
          'Directory.Read.All',
          'Files.Read.All'
        ]
      }
    }
  };

  // Start OAuth flow
  initiateOAuth(provider: 'google' | 'microsoft'): void {
    const oauthProvider = this.providers[provider];
    if (!oauthProvider) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    // For demo purposes, we'll simulate the OAuth flow
    if (oauthProvider.config.clientId === 'demo-client-id') {
      this.simulateOAuthFlow(provider);
      return;
    }

    // Real OAuth flow
    const params = new URLSearchParams({
      client_id: oauthProvider.config.clientId,
      redirect_uri: oauthProvider.config.redirectUri,
      scope: oauthProvider.config.scope.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `${oauthProvider.authUrl}?${params.toString()}`;
    window.location.href = authUrl;
  }

  // Simulate OAuth flow for demo
  private simulateOAuthFlow(provider: 'google' | 'microsoft'): void {
    const isConfirmed = confirm(
      `This would normally redirect you to ${this.providers[provider].name} for authentication.\n\n` +
      `For demo purposes, would you like to simulate a successful connection?`
    );

    if (isConfirmed) {
      // Simulate successful OAuth callback
      setTimeout(() => {
        const mockApps = this.generateMockConnectedApps(provider);
        this.handleOAuthSuccess(provider, mockApps);
      }, 1000);
    }
  }

  // Generate mock connected apps for demo
  private generateMockConnectedApps(provider: 'google' | 'microsoft'): ConnectedApp[] {
    const googleApps: ConnectedApp[] = [
      {
        id: 'gmail-' + Date.now(),
        name: 'Gmail',
        provider: 'google',
        scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
        permissions: ['Read emails', 'View email metadata'],
        lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        riskLevel: 'MEDIUM',
        dataAccess: ['Email content', 'Contact information', 'Email attachments']
      },
      {
        id: 'drive-' + Date.now(),
        name: 'Google Drive',
        provider: 'google',
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        permissions: ['View and download files', 'View file metadata'],
        lastAccessed: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        riskLevel: 'HIGH',
        dataAccess: ['All files and folders', 'Shared documents', 'File comments']
      },
      {
        id: 'calendar-' + Date.now(),
        name: 'Google Calendar',
        provider: 'google',
        scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
        permissions: ['View events', 'View calendar details'],
        lastAccessed: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        riskLevel: 'LOW',
        dataAccess: ['Calendar events', 'Meeting details', 'Attendee information']
      }
    ];

    const microsoftApps: ConnectedApp[] = [
      {
        id: 'outlook-' + Date.now(),
        name: 'Outlook',
        provider: 'microsoft',
        scopes: ['Mail.Read'],
        permissions: ['Read emails', 'View email folders'],
        lastAccessed: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        riskLevel: 'MEDIUM',
        dataAccess: ['Email messages', 'Contact lists', 'Email attachments']
      },
      {
        id: 'onedrive-' + Date.now(),
        name: 'OneDrive',
        provider: 'microsoft',
        scopes: ['Files.Read.All'],
        permissions: ['Read all files', 'View file properties'],
        lastAccessed: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        riskLevel: 'HIGH',
        dataAccess: ['All OneDrive files', 'Shared documents', 'File history']
      },
      {
        id: 'teams-' + Date.now(),
        name: 'Microsoft Teams',
        provider: 'microsoft',
        scopes: ['Team.ReadBasic.All'],
        permissions: ['View team information', 'Read team messages'],
        lastAccessed: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        riskLevel: 'MEDIUM',
        dataAccess: ['Team conversations', 'Channel information', 'Meeting recordings']
      }
    ];

    return provider === 'google' ? googleApps : microsoftApps;
  }

  // Handle successful OAuth
  private handleOAuthSuccess(provider: 'google' | 'microsoft', connectedApps: ConnectedApp[]): void {
    // Store connected apps in localStorage for demo
    const existingApps = this.getStoredConnectedApps();
    const allApps = [...existingApps, ...connectedApps];
    localStorage.setItem('cloudyx_connected_apps', JSON.stringify(allApps));

    // Show success message
    alert(
      `✅ Successfully connected to ${this.providers[provider].name}!\n\n` +
      `Found ${connectedApps.length} connected applications:\n` +
      connectedApps.map(app => `• ${app.name} (${app.riskLevel} risk)`).join('\n') +
      '\n\nRefresh the page to see updated security analysis.'
    );

    // Reload page to show new data
    window.location.reload();
  }

  // Get stored connected apps
  getStoredConnectedApps(): ConnectedApp[] {
    try {
      const stored = localStorage.getItem('cloudyx_connected_apps');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading stored apps:', error);
      return [];
    }
  }

  // Convert connected apps to dashboard format
  convertToDashboardApps(connectedApps: ConnectedApp[]): any[] {
    return connectedApps.map(app => ({
      id: app.id,
      name: app.name,
      domain: app.provider === 'google' ? 'google.com' : 'microsoft.com',
      riskLevel: app.riskLevel,
      dataTypes: this.mapDataAccessToTypes(app.dataAccess),
      hasBreaches: false, // Would check against breach databases
      thirdPartySharing: app.riskLevel === 'HIGH', // Assume high risk apps share data
      lastAccessed: app.lastAccessed,
      oauthProvider: app.provider === 'google' ? 'Google' : 'Microsoft',
      accountStatus: 'ACTIVE',
      passwordStrength: 'STRONG', // OAuth doesn't use passwords
      scopes: app.scopes,
      permissions: app.permissions
    }));
  }

  // Map data access to data types
  private mapDataAccessToTypes(dataAccess: string[]): string[] {
    const typeMapping: Record<string, string[]> = {
      'Email content': ['personal', 'communication'],
      'Contact information': ['personal', 'contacts'],
      'All files and folders': ['documents', 'files'],
      'Calendar events': ['personal', 'calendar'],
      'Team conversations': ['communication', 'workplace'],
      'Meeting recordings': ['communication', 'media']
    };

    const types = new Set<string>();
    dataAccess.forEach(access => {
      const mappedTypes = typeMapping[access] || ['general'];
      mappedTypes.forEach(type => types.add(type));
    });

    return Array.from(types);
  }

  // Revoke OAuth connection
  revokeConnection(appId: string): void {
    const connectedApps = this.getStoredConnectedApps();
    const filteredApps = connectedApps.filter(app => app.id !== appId);
    localStorage.setItem('cloudyx_connected_apps', JSON.stringify(filteredApps));
    
    alert('OAuth connection revoked successfully. Refresh the page to see updated data.');
  }

  // Get connection status
  getConnectionStatus(): { google: boolean; microsoft: boolean } {
    const connectedApps = this.getStoredConnectedApps();
    return {
      google: connectedApps.some(app => app.provider === 'google'),
      microsoft: connectedApps.some(app => app.provider === 'microsoft')
    };
  }

  // Clear all connections (for demo/testing)
  clearAllConnections(): void {
    localStorage.removeItem('cloudyx_connected_apps');
    alert('All OAuth connections cleared. Refresh the page to see updated data.');
  }
}

export const oauthService = new OAuthService();