// Extension Service - Connects dashboard with browser extension data

// Chrome API type declarations
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (extensionId: string, message: any, callback?: (response: any) => void) => void;
        lastError?: { message: string };
      };
      storage?: {
        local: {
          get: (keys?: string | string[] | null) => Promise<any>;
          set: (items: any) => Promise<void>;
          clear: () => Promise<void>;
        };
      };
    };
  }
}

export interface ExtensionScanResult {
  apps: ExtensionApp[];
  totalRiskScore: number;
  recommendations: string[];
  timestamp: Date;
  scanType: string;
}

export interface ExtensionApp {
  id: string;
  name: string;
  domain: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dataTypes: string[];
  hasBreaches: boolean;
  thirdPartySharing: boolean;
  lastAccessed: Date;
  oauthProvider?: string;
  accountStatus: 'ACTIVE' | 'INACTIVE' | 'UNKNOWN';
  passwordStrength: 'WEAK' | 'MEDIUM' | 'STRONG';
  cookies?: any[];
  trackingScripts?: string[];
}

export interface ExtensionStorageData {
  installed?: boolean;
  firstScan?: boolean;
  lastScan?: Date;
  privacyScore?: number;
  totalApps?: number;
  highRiskApps?: number;
  visitedDomains?: string[];
  oauthConnections?: any;
  scanResult?: ExtensionScanResult;
}

class ExtensionService {
  private extensionId: string = 'lldnikolaejjojgiabojpfhmpaafeige';
  private debugMode = true;

  constructor() {
    this.detectExtension();
  }

  private log(message: string, data?: any) {
    if (this.debugMode) {
      console.log(`[ExtensionService] ${message}`, data || '');
    }
  }

  private detectExtension() {
    this.log('Detecting extension...');
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      this.log('Not in browser environment');
      return;
    }

    // Check if Chrome APIs are available
    if (!window.chrome) {
      this.log('Chrome APIs not available');
      return;
    }

    if (!window.chrome.runtime) {
      this.log('Chrome runtime not available');
      return;
    }

    this.log('Chrome APIs detected, testing extension connection...');

    // Try to send a test message to detect our extension
    try {
      // From webpage, we need to specify the extension ID
      const extensionId = this.extensionId;
      this.log('Sending test message to extension ID:', extensionId);
      
      window.chrome.runtime.sendMessage(extensionId, { action: 'TEST_CHROME_API' }, (response: any) => {
        this.log('Received response from extension:', response);
        
        if (window.chrome?.runtime?.lastError) {
          this.log('Extension not detected:', window.chrome.runtime.lastError.message);
          this.log('Last error details:', {
            message: window.chrome.runtime.lastError.message,
            stack: new Error().stack
          });
        } else if (response) {
          this.log('Extension detected and responding:', response);
        } else {
          this.log('Extension not responding (no response received)');
        }
      });
    } catch (error) {
      this.log('Error testing extension connection:', error);
    }
  }

  async getExtensionData(): Promise<ExtensionStorageData | null> {
    this.log('Getting extension data...');
    
    try {
      if (typeof window === 'undefined') {
        this.log('Not in browser environment');
        return null;
      }

      if (!window.chrome?.storage) {
        this.log('Chrome storage not available');
        return null;
      }

      // Try to get data from extension storage
      const data = await window.chrome.storage.local.get(null);
      this.log('Extension storage data:', data);
      return data as ExtensionStorageData;
    } catch (error) {
      this.log('Error getting extension data:', error);
      return null;
    }
  }

  async triggerExtensionScan(): Promise<ExtensionScanResult | null> {
    this.log('Triggering extension scan...');
    
    try {
      if (typeof window === 'undefined') {
        this.log('Not in browser environment');
        return null;
      }

      // Try to trigger scan through content script
      this.log('Triggering scan through content script...');
      
      const scanResponse = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Scan timeout (30s)'));
        }, 30000); // 30 second timeout for scan
        
        const handler = (event: any) => {
          clearTimeout(timeout);
          document.removeEventListener('ghostscan-response', handler);
          resolve(event.detail);
        };
        
        document.addEventListener('ghostscan-response', handler);
        
        // Dispatch scan event
        const event = new CustomEvent('ghostscan-start-scan', {
          detail: { action: 'START_SCAN' }
        });
        document.dispatchEvent(event);
      });

      this.log('Scan response:', scanResponse);

      if (scanResponse && scanResponse.success && scanResponse.data) {
        return scanResponse.data as ExtensionScanResult;
      } else {
        this.log('Scan failed or returned invalid data');
        return null;
      }
    } catch (error) {
      this.log('Error triggering extension scan:', error);
      return null;
    }
  }

  async getScanProgress(): Promise<{ isScanning: boolean; progress: number } | null> {
    this.log('Getting scan progress...');
    
    try {
      if (typeof window === 'undefined' || !window.chrome?.runtime) {
        return null;
      }

      const response = await new Promise<any>((resolve, reject) => {
        const extensionId = this.extensionId;
        window.chrome!.runtime!.sendMessage(extensionId, { action: 'GET_SCAN_PROGRESS' }, (response: any) => {
          if (window.chrome?.runtime?.lastError) {
            reject(new Error(window.chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      if (response && response.success) {
        return response.data;
      } else {
        throw new Error(response?.error || 'Failed to get progress');
      }
    } catch (error) {
      this.log('Error getting scan progress:', error);
      return null;
    }
  }

  // Convert extension data to dashboard format
  convertToDashboardFormat(extensionData: ExtensionStorageData) {
    this.log('Converting extension data to dashboard format:', extensionData);
    
    if (!extensionData.scanResult) {
      this.log('No scan result available');
      return null;
    }

    const scanResult = extensionData.scanResult;
    
    return {
      userProfile: {
        id: '1',
        email: 'user@example.com', // Could be enhanced to get from extension
        riskScore: scanResult.totalRiskScore,
        totalApps: scanResult.apps.length,
        highRiskApps: scanResult.apps.filter(app => 
          app.riskLevel === 'HIGH' || app.riskLevel === 'CRITICAL'
        ).length,
        lastScanDate: new Date(scanResult.timestamp),
        preferences: {
          breachAlerts: true,
          weeklyReports: true,
          autoPrivacyRequests: false,
        },
      },
      apps: scanResult.apps.map(app => ({
        id: app.id,
        name: app.name,
        domain: app.domain,
        riskLevel: app.riskLevel,
        dataTypes: app.dataTypes,
        hasBreaches: app.hasBreaches,
        thirdPartySharing: app.thirdPartySharing,
        lastAccessed: new Date(app.lastAccessed),
        oauthProvider: app.oauthProvider,
        accountStatus: app.accountStatus === 'UNKNOWN' ? 'ACTIVE' : app.accountStatus,
        passwordStrength: app.passwordStrength,
        isReused: false, // Extension doesn't provide this yet
      })),
      breachAlerts: scanResult.apps
        .filter(app => app.hasBreaches)
        .map(app => ({
          id: `breach_${app.id}`,
          appId: app.id,
          breachDate: new Date(app.lastAccessed),
          dataTypes: app.dataTypes,
          severity: (app.riskLevel === 'CRITICAL' ? 'CRITICAL' : 
                   app.riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM') as 'MEDIUM' | 'LOW' | 'HIGH' | 'CRITICAL',
          description: `Data breach detected for ${app.name}`,
          isNew: true,
        })),
      recommendations: scanResult.recommendations,
      privacyScore: extensionData.privacyScore || (100 - scanResult.totalRiskScore),
      actions: this.generateRealActions(scanResult.apps, scanResult),
      privacyTips: this.generateRealPrivacyTips(scanResult.apps, scanResult, extensionData.privacyScore || (100 - scanResult.totalRiskScore))
    };
  }

  // Generate real actions based on scan data
  private generateRealActions(apps: ExtensionApp[], scanResult: ExtensionScanResult) {
    const actions = [];

    // Action 1: Review high-risk apps
    const highRiskApps = apps.filter(app => app.riskLevel === 'HIGH' || app.riskLevel === 'CRITICAL');
    if (highRiskApps.length > 0) {
      actions.push({
        id: 'review-high-risk',
        title: `Review ${highRiskApps.length} High-Risk Apps`,
        description: `Review privacy settings for ${highRiskApps.map(app => app.name).join(', ')}`,
        priority: 'HIGH',
        type: 'PRIVACY_REVIEW',
        estimatedTime: '15 min',
        completed: false
      });
    }

    // Action 2: Remove unused OAuth connections
    const oauthApps = apps.filter(app => app.oauthProvider);
    const unusedOAuth = oauthApps.filter(app => {
      const lastAccess = new Date(app.lastAccessed);
      const daysSinceAccess = (Date.now() - lastAccess.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceAccess > 30; // Unused for 30+ days
    });
    
    if (unusedOAuth.length > 0) {
      actions.push({
        id: 'remove-unused-oauth',
        title: `Remove ${unusedOAuth.length} Unused OAuth Connections`,
        description: `Remove access for apps you haven't used in 30+ days: ${unusedOAuth.map(app => app.name).join(', ')}`,
        priority: 'MEDIUM',
        type: 'OAUTH_CLEANUP',
        estimatedTime: '10 min',
        completed: false
      });
    }

    // Action 3: Block tracking domains
    const trackingApps = apps.filter(app => app.dataTypes.includes('tracking'));
    if (trackingApps.length > 0) {
      actions.push({
        id: 'block-tracking',
        title: `Block ${trackingApps.length} Tracking Domains`,
        description: `Block tracking from: ${trackingApps.map(app => app.name).join(', ')}`,
        priority: 'HIGH',
        type: 'TRACKING_PROTECTION',
        estimatedTime: '5 min',
        completed: false
      });
    }

    // Action 4: Review breach-affected apps
    const breachedApps = apps.filter(app => app.hasBreaches);
    if (breachedApps.length > 0) {
      actions.push({
        id: 'review-breaches',
        title: `Review ${breachedApps.length} Breach-Affected Apps`,
        description: `Change passwords and review security for: ${breachedApps.map(app => app.name).join(', ')}`,
        priority: 'CRITICAL',
        type: 'SECURITY',
        estimatedTime: '20 min',
        completed: false
      });
    }

    // Action 5: Improve privacy score
    if (scanResult.totalRiskScore > 50) {
      actions.push({
        id: 'improve-privacy-score',
        title: 'Improve Your Privacy Score',
        description: `Your current score is ${100 - scanResult.totalRiskScore}. Follow recommendations to improve it.`,
        priority: 'MEDIUM',
        type: 'PRIVACY_IMPROVEMENT',
        estimatedTime: '30 min',
        completed: false
      });
    }

    return actions;
  }

  // Generate real privacy tips based on scan data
  private generateRealPrivacyTips(apps: ExtensionApp[], _scanResult: ExtensionScanResult, privacyScore: number) {
    const tips = [];

    // Tip 1: Based on number of OAuth connections
    const oauthApps = apps.filter(app => app.oauthProvider);
    if (oauthApps.length > 5) {
      tips.push({
        id: 'oauth-cleanup',
        title: 'Too Many OAuth Connections',
        description: `You have ${oauthApps.length} OAuth connections. Consider removing unused ones to reduce your attack surface.`,
        category: 'OAUTH',
        difficulty: 'MEDIUM',
        timeEstimate: '10 min',
        completed: false
      });
    }

    // Tip 2: Based on tracking domains
    const trackingApps = apps.filter(app => app.dataTypes.includes('tracking'));
    if (trackingApps.length > 3) {
      tips.push({
        id: 'tracking-protection',
        title: 'Multiple Tracking Domains Detected',
        description: `You have ${trackingApps.length} tracking domains. Consider using a tracker blocker to improve privacy.`,
        category: 'TRACKING',
        difficulty: 'HIGH',
        timeEstimate: '5 min',
        completed: false
      });
    }

    // Tip 3: Based on privacy score
    if (privacyScore < 50) {
      tips.push({
        id: 'low-privacy-score',
        title: 'Low Privacy Score',
        description: `Your privacy score is ${privacyScore}. Focus on removing high-risk apps and blocking trackers.`,
        category: 'GENERAL',
        difficulty: 'HIGH',
        timeEstimate: '30 min',
        completed: false
      });
    } else if (privacyScore > 80) {
      tips.push({
        id: 'good-privacy-score',
        title: 'Great Privacy Score!',
        description: `Your privacy score is ${privacyScore}. Keep up the good work and maintain these practices.`,
        category: 'GENERAL',
        difficulty: 'LOW',
        timeEstimate: '5 min',
        completed: false
      });
    }

    // Tip 4: Based on breach-affected apps
    const breachedApps = apps.filter(app => app.hasBreaches);
    if (breachedApps.length > 0) {
      tips.push({
        id: 'breach-alert',
        title: 'Data Breach Alert',
        description: `${breachedApps.length} of your connected apps have been involved in data breaches. Change passwords immediately.`,
        category: 'SECURITY',
        difficulty: 'CRITICAL',
        timeEstimate: '20 min',
        completed: false
      });
    }

    // Tip 5: Based on third-party sharing
    const sharingApps = apps.filter(app => app.thirdPartySharing);
    if (sharingApps.length > 3) {
      tips.push({
        id: 'third-party-sharing',
        title: 'Third-Party Data Sharing',
        description: `${sharingApps.length} apps share your data with third parties. Review their privacy policies.`,
        category: 'DATA_SHARING',
        difficulty: 'MEDIUM',
        timeEstimate: '15 min',
        completed: false
      });
    }

    // Tip 6: Based on app count
    if (apps.length > 20) {
      tips.push({
        id: 'app-overload',
        title: 'Too Many Connected Apps',
        description: `You have ${apps.length} connected apps. Consider removing unused ones to reduce data exposure.`,
        category: 'GENERAL',
        difficulty: 'MEDIUM',
        timeEstimate: '25 min',
        completed: false
      });
    }

    return tips;
  }

  // Check if extension is available
  isExtensionAvailable(): boolean {
    const available = typeof window !== 'undefined' && 
           typeof window.chrome !== 'undefined' && 
           typeof window.chrome.runtime !== 'undefined';
    
    this.log('Extension available check:', available);
    return available;
  }

  // Get extension status with more detailed information
  async getExtensionStatus(): Promise<{
    available: boolean;
    installed: boolean;
    lastScan: Date | null;
    privacyScore: number | null;
    debugInfo: {
      chromeAvailable: boolean;
      runtimeAvailable: boolean;
      storageAvailable: boolean;
      testMessageSent: boolean;
    };
  }> {
    const debugInfo = {
      chromeAvailable: typeof window !== 'undefined' && typeof window.chrome !== 'undefined',
      runtimeAvailable: typeof window !== 'undefined' && typeof window.chrome?.runtime !== 'undefined',
      storageAvailable: typeof window !== 'undefined' && typeof window.chrome?.storage !== 'undefined',
      testMessageSent: false,
    };

    this.log('Getting extension status with debug info:', debugInfo);
    
    const available = this.isExtensionAvailable();
    
    if (!available) {
      return {
        available: false,
        installed: false,
        lastScan: null,
        privacyScore: null,
        debugInfo,
      };
    }

    try {
      // Test if we can actually communicate with the extension
              const testResponse = await new Promise<any>((resolve, reject) => {
          const extensionId = this.extensionId;
        
        // Add timeout to prevent hanging
        const timeout = setTimeout(() => {
          reject(new Error('Extension communication timeout'));
        }, 5000);
        
        window.chrome!.runtime!.sendMessage(extensionId, { action: 'TEST_CHROME_API' }, (response: any) => {
          clearTimeout(timeout);
          debugInfo.testMessageSent = true;
          resolve(response);
        });
      });

      this.log('Test message response:', testResponse);

      // Since we can't access extension storage from webpage, 
      // we'll consider it installed if we can communicate with it
      const data = await this.getExtensionData();
      return {
        available: true,
        installed: true, // If we can send messages, it's installed
        lastScan: data?.lastScan ? new Date(data.lastScan) : null,
        privacyScore: data?.privacyScore || null,
        debugInfo,
      };
    } catch (error) {
      this.log('Error getting extension status:', error);
      return {
        available: true,
        installed: false,
        lastScan: null,
        privacyScore: null,
        debugInfo,
      };
    }
  }

  // Test connection to extension
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    details: any;
  }> {
    this.log('Testing extension connection...');
    
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return {
          success: false,
          message: 'Not in browser environment',
          details: {},
        };
      }

      // Try to communicate with the extension through the content script
      this.log('Attempting to communicate with extension through content script...');
      
      // Method 1: Try direct Chrome API (might not work on web pages)
      if (window.chrome && window.chrome.runtime) {
        this.log('Chrome APIs available, trying direct communication...');
        try {
      const pingResponse = await new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Extension communication timeout (5s)'));
            }, 5000);

            window.chrome!.runtime!.sendMessage(this.extensionId, { action: 'PING' }, (response: any) => {
              clearTimeout(timeout);
              this.log('PING response received:', response);
              this.log('Chrome runtime lastError:', window.chrome?.runtime?.lastError);
              
          if (window.chrome?.runtime?.lastError) {
            reject(new Error(window.chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      if (pingResponse && pingResponse.success && pingResponse.message === 'PONG') {
        return {
          success: true,
              message: 'Extension connected successfully (direct API)',
              details: { pingResponse },
            };
          }
        } catch (error) {
          this.log('Direct API communication failed:', error);
        }
      }

      // Method 2: Try to detect if content script is running
      this.log('Trying to detect content script...');
      
      // Check if the content script has injected any elements or made any changes
      const contentScriptDetected = document.querySelector('[data-ghostscan]') || 
                                   window.hasOwnProperty('ghostScanExtension') ||
                                   document.head.querySelector('script[src*="content.js"]');
      
      if (contentScriptDetected) {
        this.log('Content script detected, trying to communicate...');
        
        // Try to send a message through the content script
        const event = new CustomEvent('ghostscan-test-connection', {
          detail: { action: 'PING' }
        });
        document.dispatchEvent(event);
        
        // Wait for response
        const response = await new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Content script communication timeout (3s)'));
          }, 3000);
          
          const handler = (event: any) => {
            clearTimeout(timeout);
            document.removeEventListener('ghostscan-response', handler);
            resolve(event.detail);
          };
          
          document.addEventListener('ghostscan-response', handler);
        });
        
        if (response && response.success) {
          return {
            success: true,
            message: 'Extension connected successfully (content script)',
            details: { response },
          };
        }
      }

      // Method 3: Check if extension is installed by trying to access extension storage
      this.log('Trying to access extension storage...');
      try {
        if (window.chrome && window.chrome.storage) {
          const storageData = await window.chrome.storage.local.get(null);
          if (storageData && Object.keys(storageData).length > 0) {
        return {
              success: true,
              message: 'Extension detected (storage access)',
              details: { storageData },
            };
          }
        }
      } catch (error) {
        this.log('Storage access failed:', error);
      }

      return {
        success: false,
        message: 'Extension not detected or not responding',
        details: { 
          chromeAvailable: !!window.chrome,
          runtimeAvailable: !!(window.chrome && window.chrome.runtime),
          contentScriptDetected: !!contentScriptDetected
        },
      };
    } catch (error) {
      this.log('Connection test error:', error);
      return {
        success: false,
        message: `Connection test failed: ${error}`,
        details: { error: String(error) },
      };
    }
  }
}

export const extensionService = new ExtensionService(); 