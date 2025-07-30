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

      if (!window.chrome?.runtime) {
        this.log('Chrome runtime not available');
        return null;
      }

      // First, test if the extension is actually responding
      this.log('Testing extension connection before scan...');
      const pingResponse = await new Promise<any>((resolve, reject) => {
        const extensionId = this.extensionId;
        const timeout = setTimeout(() => {
          reject(new Error('Extension connection timeout'));
        }, 5000);
        
        window.chrome!.runtime!.sendMessage(extensionId, { action: 'PING' }, (response: any) => {
          clearTimeout(timeout);
          if (window.chrome?.runtime?.lastError) {
            reject(new Error(window.chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      this.log('Ping response:', pingResponse);

              // Now trigger the scan
        const response = await new Promise<any>((resolve, reject) => {
          const extensionId = this.extensionId;
        
        // Add timeout to prevent hanging
        const timeout = setTimeout(() => {
          reject(new Error('Scan request timeout'));
        }, 10000); // 10 second timeout for scan
        
        window.chrome!.runtime!.sendMessage(extensionId, { action: 'START_SCAN' }, (response: any) => {
          clearTimeout(timeout);
          if (window.chrome?.runtime?.lastError) {
            reject(new Error(window.chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      if (response && response.success) {
        this.log('Scan completed successfully:', response.data);
        return response.data as ExtensionScanResult;
      } else {
        throw new Error(response?.error || 'Scan failed');
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
    };
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