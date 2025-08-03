// GhostScan Browser Extension - Background Service Worker

console.log('🔍 GhostScan Background Service Worker loaded');

// Performance optimization: Limit concurrent operations
let isProcessingScan = false;
let lastScanTime = 0;
const SCAN_COOLDOWN = 10000; // 10 seconds between scans

// Track active operations to prevent overload
let activeOperations = 0;
const MAX_CONCURRENT_OPERATIONS = 3;

interface ScanResult {
  apps: AppData[];
  totalRiskScore: number;
  recommendations: string[];
  timestamp: Date;
  scanType: string;
}

interface AppData {
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
  cookies?: CookieData[];
  trackingScripts?: string[];
}

interface CookieData {
  name: string;
  domain: string;
  value: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: string;
  expirationDate?: number;
}

class GhostScanBackground {
  private isScanning = false;
  private scanProgress = 0;
  private visitedDomains: Set<string> = new Set();
  private oauthConnections: Map<string, any> = new Map();

  constructor() {
    console.log('🔍 GhostScanBackground constructor called');
    this.initializeListeners();
    console.log('🔍 GhostScanBackground initialization complete');
  }

  private initializeListeners() {
    console.log('🔍 Initializing listeners...');
    
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      console.log('GhostScan extension installed:', details.reason);
      if (details.reason === 'install') {
        this.onFirstInstall();
      }
    });

    // SINGLE MESSAGE LISTENER - Remove all duplicates
    console.log('🔍 Setting up SINGLE message listener...');
    
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('🔍 Background received message:', message.action);
      
      // Check if we're overloaded
      if (activeOperations >= MAX_CONCURRENT_OPERATIONS) {
        console.log('🔍 Too many concurrent operations, rejecting request');
        sendResponse({ success: false, error: 'System busy, please try again' });
        return true;
      }
      
      // Handle the message
      this.handleMessage(message, sender, sendResponse);
      
      // Return true to keep message channel open for async response
      return true;
    });

    // Handle messages from external web pages (like the dashboard)
    console.log('🔍 Setting up external message listener...');
    chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
      console.log('🔍 External message:', message);
      
      // Check if we're overloaded
      if (activeOperations >= MAX_CONCURRENT_OPERATIONS) {
        console.log('🔍 Too many concurrent operations, rejecting external request');
        sendResponse({ success: false, error: 'System busy, please try again' });
        return true;
      }
      
      // Handle external messages
      this.handleExternalMessage(message, sender, sendResponse);
      return true;
    });

    // Track navigation to build domain history (optimized)
    chrome.webNavigation.onCompleted.addListener((details) => {
      if (details.url) {
        const domain = new URL(details.url).hostname;
        this.visitedDomains.add(domain);
        if (this.visitedDomains.size > 1000) {
          const domainsArray = Array.from(this.visitedDomains);
          this.visitedDomains = new Set(domainsArray.slice(-500));
        }
        console.log('Tracked domain:', domain);
      }
    });

    // Track cookie changes (limited logging)
    chrome.cookies.onChanged.addListener((changeInfo) => {
      if (changeInfo.cookie.name.includes('_ga') || 
          changeInfo.cookie.name.includes('_fbp') || 
          changeInfo.cookie.name.includes('_gid')) {
        console.log('Tracking cookie changed:', changeInfo.cookie.name);
      }
    });
  }

  private async onFirstInstall() {
    console.log('🔍 First install - initializing extension');
    try {
      // Initialize storage with default values
      await chrome.storage.local.set({
        privacyScore: 85,
        totalApps: 0,
        highRiskApps: 0,
        lastScan: null,
        scanResult: null,
        detectedApplications: [],
        oauthDetections: [],
        trackingDetections: []
      });
      console.log('🔍 Extension initialized successfully');
    } catch (error) {
      console.error('🔍 Error initializing extension:', error);
    }
  }

  private async handleMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
    activeOperations++;
    
    try {
      console.log('🔍 Handling message:', message.action);
      
      switch (message.action) {
        case 'START_SCAN':
          if (isProcessingScan) {
            sendResponse({ success: false, error: 'Scan already in progress' });
            return;
          }
          const now = Date.now();
          if (now - lastScanTime < SCAN_COOLDOWN) {
            sendResponse({ success: false, error: 'Please wait before starting another scan' });
            return;
          }
          isProcessingScan = true;
          lastScanTime = now;
          
          try {
            // Notify all content scripts to start scanning
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
              if (tab.id && tab.url && !tab.url.startsWith('chrome://')) {
                try {
                  await chrome.tabs.sendMessage(tab.id, { action: 'START_SCAN' });
                } catch (error) {
                  // Content script might not be loaded on this tab
                  console.log('🔍 Could not send START_SCAN to tab:', tab.id);
                }
              }
            }
            
            const scanResult = await this.startScan();
            sendResponse({ success: true, data: scanResult });
          } finally {
            isProcessingScan = false;
            
            // Notify all content scripts to stop scanning
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
              if (tab.id && tab.url && !tab.url.startsWith('chrome://')) {
                try {
                  await chrome.tabs.sendMessage(tab.id, { action: 'STOP_SCAN' });
                } catch (error) {
                  // Content script might not be loaded on this tab
                  console.log('🔍 Could not send STOP_SCAN to tab:', tab.id);
                }
              }
            }
          }
          break;

        case 'GET_SCAN_STATUS':
          sendResponse({ 
            success: true, 
            isScanning: this.isScanning, 
            progress: this.scanProgress 
          });
          break;

        case 'GET_STORED_DATA':
          const data = await this.getStorageData();
          sendResponse({ success: true, data });
          break;

        case 'CLEAR_DATA':
          await this.clearScanData();
          sendResponse({ success: true });
          break;

        case 'PING':
          sendResponse({ success: true, message: 'PONG from background' });
          break;

        case 'OAUTH_DETECTED':
          await this.storeOAuthDetection(message);
          sendResponse({ success: true });
          break;

        case 'TRACKING_DETECTED':
          await this.storeTrackingDetection(message);
          sendResponse({ success: true });
          break;

        case 'FORM_DETECTED':
          await this.storeFormDetection(message);
          sendResponse({ success: true });
          break;

        case 'APP_DETECTED':
          await this.storeDetectedApplication(message);
          sendResponse({ success: true });
          break;

        default:
          console.log('🔍 Unknown message action:', message.action);
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('🔍 Error handling message:', error);
      sendResponse({ success: false, error: (error as Error).message });
    } finally {
      activeOperations--;
    }
  }

  private async handleExternalMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
    activeOperations++;
    
    try {
      console.log('🔍 Handling external message:', message);
      
      // Only allow specific external actions for security
      if (message.action === 'GET_EXTENSION_STATUS') {
        sendResponse({ 
          success: true, 
          status: 'active',
          version: '1.0.1'
        });
      } else if (message.action === 'PING') {
        sendResponse({ success: true, message: 'PONG from external' });
      } else {
        sendResponse({ success: false, error: 'Unauthorized action' });
      }
    } catch (error) {
      console.error('🔍 Error handling external message:', error);
      sendResponse({ success: false, error: (error as Error).message });
    } finally {
      activeOperations--;
    }
  }

  private async startScan(): Promise<ScanResult> {
    if (this.isScanning) {
      throw new Error('Scan already in progress');
    }

    this.isScanning = true;
    this.scanProgress = 0;

    try {
      console.log('Starting real privacy scan...');
      
      // Step 1: Collect cookies (limited)
      await this.updateProgress('Collecting cookies...', 10);
      const cookies = await this.collectCookies();
      
      // Step 2: Analyze OAuth connections (optimized)
      await this.updateProgress('Analyzing OAuth connections...', 30);
      const oauthData = await this.analyzeOAuthConnections();
      
      // Step 3: Check browsing history for SaaS applications (limited)
      await this.updateProgress('Analyzing browsing history for SaaS applications...', 50);
      const historyData = await this.analyzeBrowsingHistory();
      
      // Step 4: Detect tracking scripts (optimized)
      await this.updateProgress('Detecting tracking scripts...', 70);
      const trackingData = await this.detectTrackingScripts();
      
      // Step 5: Generate comprehensive report
      await this.updateProgress('Generating privacy report...', 90);
      const scanResult = await this.generateComprehensiveReport(
        cookies, 
        oauthData, 
        historyData, 
        trackingData
      );

      // Store scan result
      await this.storeScanResult(scanResult);
      await this.updateProgress('Scan completed!', 100);

      return scanResult;

    } finally {
      this.isScanning = false;
      this.scanProgress = 0;
    }
  }

  private async updateProgress(message: string, progress: number): Promise<void> {
    console.log(message);
    this.scanProgress = progress;
    await new Promise(resolve => setTimeout(resolve, 100)); // Reduced pause for better performance
  }

  private async collectCookies(): Promise<CookieData[]> {
    try {
      const cookies = await chrome.cookies.getAll({});
      console.log(`Collected ${cookies.length} cookies`);
      
      // Limit cookie processing to prevent freezing
      const limitedCookies = cookies.slice(0, 500);
      
      return limitedCookies.map(cookie => ({
        name: cookie.name,
        domain: cookie.domain,
        value: cookie.value,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        expirationDate: cookie.expirationDate
      }));
    } catch (error) {
      console.error('Error collecting cookies:', error);
      return [];
    }
  }

  private async analyzeOAuthConnections(): Promise<any[]> {
    try {
      // Get current tab to check for OAuth providers
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const oauthProviders = ['google.com', 'facebook.com', 'github.com', 'twitter.com', 'linkedin.com'];
      const connections: any[] = [];

      for (const provider of oauthProviders) {
        const cookies = await chrome.cookies.getAll({ domain: provider });
        if (cookies.length > 0) {
          connections.push({
            provider,
            cookies: cookies.length,
            lastAccessed: new Date(),
            dataTypes: this.getOAuthDataTypes(provider)
          });
        }
      }

      console.log(`Found ${connections.length} OAuth connections`);
      return connections;
    } catch (error) {
      console.error('Error analyzing OAuth connections:', error);
      return [];
    }
  }

  private async analyzeBrowsingHistory(): Promise<any> {
    try {
      // Check if history API is available
      if (typeof chrome.history === 'undefined') {
        console.log('History API not available, skipping history analysis');
        return { totalVisits: 0, uniqueDomains: 0, topDomains: [], saasApplications: [] };
      }

      // Get recent browsing history (limited to last 7 days and 500 results)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const history = await chrome.history.search({
        text: '',
        startTime: sevenDaysAgo,
        maxResults: 500 // Reduced from 1000
      });

      // Group by domain
      const domainStats = new Map<string, number>();
      const saasApplications: any[] = [];
      
      // Common domains to skip
      const skipDomains = [
        'google.com', 'google.co.uk', 'google.ca',
        'facebook.com', 'twitter.com', 'linkedin.com',
        'github.com', 'stackoverflow.com', 'reddit.com',
        'youtube.com', 'amazon.com', 'netflix.com',
        'localhost', '127.0.0.1', 'chrome://', 'chrome-extension://',
        'vercel.app', 'github.io', 'netlify.app'
      ];

      // Known SaaS application patterns
      const saasPatterns = [
        'notion', 'figma', 'slack', 'discord', 'zoom', 'teams',
        'asana', 'trello', 'monday', 'clickup', 'airtable',
        'canva', 'figma', 'sketch', 'invision', 'framer',
        'stripe', 'paypal', 'square', 'shopify', 'woocommerce',
        'hubspot', 'salesforce', 'pipedrive', 'zoho',
        'mailchimp', 'sendgrid', 'convertkit', 'klaviyo',
        'intercom', 'zendesk', 'freshdesk', 'helpscout',
        'deepseek', 'claude', 'perplexity', 'anthropic',
        'openai', 'chatgpt', 'bard', 'bing', 'duckduckgo',
        'dropbox', 'box', 'onedrive', 'icloud', 'mega',
        'spotify', 'apple', 'microsoft', 'adobe', 'autodesk'
      ];

      // Process history items with limits
      const processedItems = history.slice(0, 300); // Limit processing
      
      processedItems.forEach(item => {
        if (item.url) {
          const domain = new URL(item.url).hostname;
          domainStats.set(domain, (domainStats.get(domain) || 0) + 1);
          
          // Check if this domain looks like a SaaS application
          const isSaaS = saasPatterns.some(pattern => 
            domain.includes(pattern) || item.title?.toLowerCase().includes(pattern)
          );
          
          const shouldSkip = skipDomains.some(skip => domain.includes(skip));
          
          if (isSaaS && !shouldSkip && saasApplications.length < 50) { // Limit SaaS apps
            // Check if we already have this application
            const existingIndex = saasApplications.findIndex(app => app.domain === domain);
            
            if (existingIndex === -1) {
              // Determine risk level based on domain characteristics
              let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
              const dataTypes: string[] = ['saas_application'];
              
              // Check for Chinese-owned domains
              const chineseDomains = ['deepseek', 'baidu', 'alibaba', 'tencent', 'bytedance'];
              if (chineseDomains.some(chinese => domain.includes(chinese))) {
                riskLevel = 'CRITICAL';
                dataTypes.push('international_data_sharing');
              }
              
              // Check for AI/ML applications (higher risk)
              const aiDomains = ['openai', 'anthropic', 'claude', 'deepseek', 'perplexity'];
              if (aiDomains.some(ai => domain.includes(ai))) {
                riskLevel = riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH';
                dataTypes.push('ai_processing');
              }
              
              // Check for financial applications
              const financialDomains = ['stripe', 'paypal', 'square', 'shopify'];
              if (financialDomains.some(financial => domain.includes(financial))) {
                riskLevel = riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH';
                dataTypes.push('financial_data');
              }
              
              saasApplications.push({
                id: `saas_${domain}`,
                name: item.title || this.getAppNameFromDomain(domain),
                domain: domain,
                riskLevel: riskLevel,
                dataTypes: dataTypes,
                hasBreaches: false,
                thirdPartySharing: true,
                lastAccessed: new Date(item.lastVisitTime || Date.now()),
                accountStatus: 'UNKNOWN' as const,
                passwordStrength: 'MEDIUM' as const,
                visitCount: domainStats.get(domain) || 1,
                url: item.url
              });
            } else {
              // Update visit count for existing application
              saasApplications[existingIndex].visitCount = domainStats.get(domain) || 1;
            }
          }
        }
      });

      console.log(`Analyzed ${processedItems.length} history items from ${domainStats.size} domains`);
      console.log(`Found ${saasApplications.length} potential SaaS applications`);
      
      return {
        totalVisits: processedItems.length,
        uniqueDomains: domainStats.size,
        topDomains: Array.from(domainStats.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10),
        saasApplications: saasApplications
      };
    } catch (error) {
      console.error('Error analyzing browsing history:', error);
      return { totalVisits: 0, uniqueDomains: 0, topDomains: [], saasApplications: [] };
    }
  }

  private async detectTrackingScripts(): Promise<string[]> {
    try {
      // This would require content script injection to detect tracking scripts
      // For now, we'll check for common tracking domains in cookies
      const trackingDomains = [
        'google-analytics.com',
        'facebook.com',
        'doubleclick.net',
        'googlesyndication.com',
        'amazon-adsystem.com',
        'bing.com'
      ];

      const trackingScripts: string[] = [];
      for (const domain of trackingDomains) {
        const cookies = await chrome.cookies.getAll({ domain });
        if (cookies.length > 0) {
          trackingScripts.push(domain);
        }
      }

      console.log(`Detected ${trackingScripts.length} tracking domains`);
      return trackingScripts;
    } catch (error) {
      console.error('Error detecting tracking scripts:', error);
      return [];
    }
  }

  private async generateComprehensiveReport(
    cookies: CookieData[],
    oauthData: any[],
    historyData: any,
    trackingData: string[]
  ): Promise<ScanResult> {
    // Get detected applications from storage
    const result = await chrome.storage.local.get(['detectedApplications']);
    const detectedApplications = result.detectedApplications || [];
    const apps: AppData[] = [];
    let totalRiskScore = 0;

    // Process OAuth connections
    oauthData.forEach(oauth => {
      const app: AppData = {
        id: `oauth_${oauth.provider}`,
        name: this.getAppNameFromDomain(oauth.provider),
        domain: oauth.provider,
        riskLevel: this.calculateRiskLevel(oauth.cookies, oauth.dataTypes),
        dataTypes: oauth.dataTypes,
        hasBreaches: this.checkForBreaches(oauth.provider),
        thirdPartySharing: true,
        lastAccessed: oauth.lastAccessed,
        oauthProvider: oauth.provider,
        accountStatus: 'ACTIVE',
        passwordStrength: 'STRONG'
      };
      apps.push(app);
      totalRiskScore += this.calculateAppRiskScore(app);
    });

    // Process tracking domains
    trackingData.forEach(domain => {
      const app: AppData = {
        id: `tracking_${domain}`,
        name: this.getAppNameFromDomain(domain),
        domain: domain,
        riskLevel: 'HIGH',
        dataTypes: ['tracking', 'analytics'],
        hasBreaches: false,
        thirdPartySharing: true,
        lastAccessed: new Date(),
        accountStatus: 'UNKNOWN',
        passwordStrength: 'MEDIUM',
        trackingScripts: [domain]
      };
      apps.push(app);
      totalRiskScore += this.calculateAppRiskScore(app);
    });

    // Process detected SaaS applications from real-time detection
    detectedApplications.forEach((detectedApp: any) => {
      const app: AppData = {
        id: detectedApp.id,
        name: detectedApp.name,
        domain: detectedApp.domain,
        riskLevel: detectedApp.riskLevel,
        dataTypes: detectedApp.dataTypes,
        hasBreaches: detectedApp.hasBreaches,
        thirdPartySharing: detectedApp.thirdPartySharing,
        lastAccessed: new Date(detectedApp.lastAccessed),
        accountStatus: detectedApp.accountStatus,
        passwordStrength: detectedApp.passwordStrength
      };
      apps.push(app);
      totalRiskScore += this.calculateAppRiskScore(app);
    });

    // Process SaaS applications from browsing history
    if (historyData.saasApplications) {
      historyData.saasApplications.forEach((saasApp: any) => {
        // Check if this app is already included from real-time detection
        const existingApp = apps.find(app => app.domain === saasApp.domain);
        if (!existingApp) {
          const app: AppData = {
            id: saasApp.id,
            name: saasApp.name,
            domain: saasApp.domain,
            riskLevel: saasApp.riskLevel,
            dataTypes: saasApp.dataTypes,
            hasBreaches: saasApp.hasBreaches,
            thirdPartySharing: saasApp.thirdPartySharing,
            lastAccessed: saasApp.lastAccessed,
            accountStatus: saasApp.accountStatus,
            passwordStrength: saasApp.passwordStrength
          };
          apps.push(app);
          totalRiskScore += this.calculateAppRiskScore(app);
        }
      });
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(apps, cookies, historyData);

    return {
      apps,
      totalRiskScore: Math.min(totalRiskScore, 100),
      recommendations,
      timestamp: new Date(),
      scanType: 'COMPREHENSIVE'
    };
  }

  private getOAuthDataTypes(provider: string): string[] {
    const dataTypes: { [key: string]: string[] } = {
      'google.com': ['oauth_connection', 'email', 'profile', 'calendar', 'drive'],
      'facebook.com': ['oauth_connection', 'profile', 'friends', 'posts'],
      'github.com': ['oauth_connection', 'profile', 'repositories'],
      'twitter.com': ['oauth_connection', 'profile', 'tweets'],
      'linkedin.com': ['oauth_connection', 'profile', 'connections']
    };
    return dataTypes[provider] || ['oauth_connection', 'profile'];
  }

  private getAppNameFromDomain(domain: string): string {
    const names: { [key: string]: string } = {
      'google.com': 'Google',
      'facebook.com': 'Facebook',
      'github.com': 'GitHub',
      'twitter.com': 'Twitter',
      'linkedin.com': 'LinkedIn',
      'google-analytics.com': 'Google Analytics',
      'doubleclick.net': 'Google Ads',
      'googlesyndication.com': 'Google AdSense',
      'amazon-adsystem.com': 'Amazon Ads',
      'bing.com': 'Bing Ads'
    };
    return names[domain] || domain;
  }

  private calculateRiskLevel(cookieCount: number, dataTypes: string[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    let score = 0;
    score += cookieCount * 2;
    score += dataTypes.length * 10;
    
    if (score > 50) return 'CRITICAL';
    if (score > 30) return 'HIGH';
    if (score > 15) return 'MEDIUM';
    return 'LOW';
  }

  private calculateAppRiskScore(app: AppData): number {
    let score = 0;
    
    // Risk level scoring
    switch (app.riskLevel) {
      case 'CRITICAL': score += 30; break;
      case 'HIGH': score += 20; break;
      case 'MEDIUM': score += 10; break;
      case 'LOW': score += 5; break;
    }
    
    // Data types scoring
    score += app.dataTypes.length * 5;
    
    // Breach scoring
    if (app.hasBreaches) score += 15;
    
    // Third-party sharing scoring
    if (app.thirdPartySharing) score += 10;
    
    return score;
  }

  private checkForBreaches(domain: string): boolean {
    // This would integrate with a breach database API
    // For now, return mock data
    const breachedDomains = ['facebook.com', 'linkedin.com'];
    return breachedDomains.includes(domain);
  }

  private generateRecommendations(apps: AppData[], cookies: CookieData[], historyData: any): string[] {
    const recommendations: string[] = [];
    
    const highRiskApps = apps.filter(app => app.riskLevel === 'HIGH' || app.riskLevel === 'CRITICAL');
    if (highRiskApps.length > 0) {
      recommendations.push(`Review privacy settings for ${highRiskApps.length} high-risk apps`);
    }
    
    if (cookies.length > 100) {
      recommendations.push('Consider clearing tracking cookies to improve privacy');
    }
    
    if (historyData.uniqueDomains > 50) {
      recommendations.push('You visit many different websites - consider using privacy-focused browsers');
    }
    
    const oauthApps = apps.filter(app => app.oauthProvider);
    if (oauthApps.length > 5) {
      recommendations.push('You have many OAuth connections - review and remove unused ones');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Great job! Your privacy settings look good');
    }
    
    return recommendations;
  }

  private async testChromeAPI(): Promise<any> {
    const tests = {
      runtime: typeof chrome.runtime !== 'undefined',
      storage: typeof chrome.storage !== 'undefined',
      cookies: typeof chrome.cookies !== 'undefined',
      tabs: typeof chrome.tabs !== 'undefined',
      webNavigation: typeof chrome.webNavigation !== 'undefined',
      history: typeof chrome.history !== 'undefined',
      identity: typeof chrome.identity !== 'undefined'
    };

    console.log('Chrome API tests:', tests);
    return tests;
  }

  private async getStorageData(): Promise<any> {
    try {
      const data = await chrome.storage.local.get(null);
      console.log('Storage data:', data);
      return data;
    } catch (error) {
      console.error('Error getting storage data:', error);
      return { error: (error as Error).message };
    }
  }

  private async storeScanResult(scanResult: ScanResult): Promise<void> {
    try {
      await chrome.storage.local.set({
        lastScan: scanResult.timestamp,
        scanResult: scanResult,
        privacyScore: 100 - scanResult.totalRiskScore,
        totalApps: scanResult.apps.length,
        highRiskApps: scanResult.apps.filter((app) => 
          app.riskLevel === 'HIGH' || app.riskLevel === 'CRITICAL'
        ).length
      });
      console.log('Scan result stored');
    } catch (error) {
      console.error('Error storing scan result:', error);
    }
  }

  private async clearScanData(): Promise<void> {
    try {
      await chrome.storage.local.clear();
      await this.onFirstInstall(); // Reset to initial state
      console.log('Scan data cleared');
    } catch (error) {
      console.error('Error clearing scan data:', error);
    }
  }

  // Store detected SaaS applications
  private async storeDetectedApplication(message: any): Promise<void> {
    try {
      const { domain, title, url, riskLevel, riskFactors, dataTypes, timestamp } = message;
      
      // Get existing detected applications
      const result = await chrome.storage.local.get(['detectedApplications']);
      const detectedApplications = result.detectedApplications || [];
      
      // Check if this application is already stored
      const existingIndex = detectedApplications.findIndex((app: any) => app.domain === domain);
      
      const newApp = {
        id: `saas_${domain}`,
        name: title || this.getAppNameFromDomain(domain),
        domain: domain,
        riskLevel: riskLevel,
        dataTypes: dataTypes,
        hasBreaches: false, // Would need to check against breach database
        thirdPartySharing: riskFactors.includes('THIRD_PARTY_COOKIES'),
        lastAccessed: new Date(timestamp),
        accountStatus: 'UNKNOWN' as const,
        passwordStrength: 'MEDIUM' as const,
        riskFactors: riskFactors,
        url: url,
        detectedAt: timestamp
      };
      
      if (existingIndex >= 0) {
        // Update existing application
        detectedApplications[existingIndex] = {
          ...detectedApplications[existingIndex],
          lastAccessed: new Date(timestamp),
          riskLevel: riskLevel,
          riskFactors: riskFactors
        };
      } else {
        // Add new application
        detectedApplications.push(newApp);
      }
      
      // Store updated list
      await chrome.storage.local.set({ detectedApplications });
      console.log(`Stored detected application: ${domain}`);
    } catch (error) {
      console.error('Error storing detected application:', error);
    }
  }

  // Store OAuth detections
  private async storeOAuthDetection(message: any): Promise<void> {
    try {
      const { provider, url } = message;
      
      // Get existing OAuth detections
      const result = await chrome.storage.local.get(['oauthDetections']);
      const oauthDetections = result.oauthDetections || [];
      
      const newDetection = {
        provider: provider,
        url: url,
        detectedAt: new Date().toISOString()
      };
      
      oauthDetections.push(newDetection);
      
      // Store updated list
      await chrome.storage.local.set({ oauthDetections });
      console.log(`Stored OAuth detection: ${provider} at ${url}`);
    } catch (error) {
      console.error('Error storing OAuth detection:', error);
    }
  }

  // Store tracking detections
  private async storeTrackingDetection(message: any): Promise<void> {
    try {
      const { tracker, url } = message;
      const result = await chrome.storage.local.get(['trackingDetections']);
      const trackingDetections = result.trackingDetections || [];
      
      const newDetection = {
        tracker: tracker,
        url: url,
        detectedAt: new Date().toISOString()
      };
      
      trackingDetections.push(newDetection);
      await chrome.storage.local.set({ trackingDetections });
      console.log(`Stored tracking detection: ${tracker} at ${url}`);
    } catch (error) {
      console.error('Error storing tracking detection:', error);
    }
  }

  // Store form detections
  private async storeFormDetection(message: any): Promise<void> {
    try {
      const { fields, url } = message;
      const result = await chrome.storage.local.get(['formDetections']);
      const formDetections = result.formDetections || [];
      
      const newDetection = {
        fields: fields,
        url: url,
        detectedAt: new Date().toISOString()
      };
      
      formDetections.push(newDetection);
      await chrome.storage.local.set({ formDetections });
      console.log(`Stored form detection: ${fields.join(', ')} at ${url}`);
    } catch (error) {
      console.error('Error storing form detection:', error);
    }
  }
}

// Initialize the background service
new GhostScanBackground();
