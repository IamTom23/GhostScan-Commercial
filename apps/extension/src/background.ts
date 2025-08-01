// GhostScan Browser Extension - Background Service Worker

console.log('🔍 GhostScan Background Service Worker loaded');

// Add a global message listener as a backup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('🔍 GLOBAL MESSAGE LISTENER CALLED!');
  console.log('🔍 Global message:', message);
  if (message.action === 'PING') {
    console.log('🔍 PING received in global listener');
    sendResponse({ success: true, message: 'PONG from global listener' });
    return true;
  }
});

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

    // Handle messages from popup and content scripts
    console.log('🔍 Setting up message listener...');
    
    // Test if the listener is working by adding a simple test
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('🔍 MESSAGE LISTENER CALLED!');
      console.log('🔍 Background received message:', message);
      console.log('🔍 Sender:', sender);
      console.log('🔍 Message action:', message.action);
      console.log('🔍 Sender origin:', sender.origin);
      console.log('🔍 Sender tab:', sender.tab);
      
      // Handle the message
      this.handleMessage(message, sender, sendResponse);
      
      // Return true to keep message channel open for async response
      return true;
    });
    
    // Also try setting up a simple test listener
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('🔍 SIMPLE TEST LISTENER CALLED!');
      if (message.action === 'PING') {
        console.log('🔍 PING received in simple listener');
        sendResponse({ success: true, message: 'PONG from simple listener' });
        return true;
      }
    });

    // Handle messages from external web pages (like the dashboard)
    console.log('🔍 Setting up external message listener...');
    chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
      console.log('🔍 EXTERNAL MESSAGE LISTENER CALLED!');
      console.log('🔍 External message:', message);
      console.log('🔍 External sender:', sender);
      console.log('🔍 External sender origin:', sender.origin);
      
      // Handle the message the same way as internal messages
      this.handleMessage(message, sender, sendResponse);
      
      // Return true to keep message channel open for async response
      return true;
    });
    
    console.log('🔍 Message listener set up successfully');

    // Test the message listener immediately after setup
    console.log('🔍 Testing message listener...');
    setTimeout(() => {
      console.log('🔍 Sending test message to self...');
      chrome.runtime.sendMessage({action: 'PING'}, (response) => {
        console.log('🔍 Test message response:', response);
        if (chrome.runtime.lastError) {
          console.log('🔍 Test message error:', chrome.runtime.lastError);
        }
      });
    }, 1000);

    // Track navigation to build domain history
    chrome.webNavigation.onCompleted.addListener((details) => {
      if (details.url) {
        const domain = new URL(details.url).hostname;
        this.visitedDomains.add(domain);
        console.log('Tracked domain:', domain);
      }
    });

    // Track cookie changes
    chrome.cookies.onChanged.addListener((changeInfo) => {
      console.log('Cookie changed:', changeInfo.cookie.name, 'on', changeInfo.cookie.domain);
    });
  }

  private async onFirstInstall() {
    console.log('GhostScan extension first install');
    
    try {
      // Set up initial storage
      await chrome.storage.local.set({
        installed: true,
        firstScan: false,
        lastScan: null,
        privacyScore: 0,
        totalApps: 0,
        highRiskApps: 0,
        visitedDomains: [],
        oauthConnections: {}
      });
      console.log('Initial storage set up');
    } catch (error) {
      console.error('Error setting up initial storage:', error);
    }
  }

  private async handleMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
    console.log('Handling message:', message.action);
    
    try {
      switch (message.action) {
        case 'START_SCAN':
          const scanResult = await this.startScan();
          console.log('Scan completed:', scanResult);
          sendResponse({ success: true, data: scanResult });
          break;

        case 'GET_SCAN_PROGRESS':
          sendResponse({ 
            success: true, 
            data: { 
              isScanning: this.isScanning, 
              progress: this.scanProgress 
            } 
          });
          break;

        case 'TEST_CHROME_API':
          const apiTest = await this.testChromeAPI();
          sendResponse({ success: true, data: apiTest });
          break;

        case 'GET_STORAGE_DATA':
          const storageData = await this.getStorageData();
          sendResponse({ success: true, data: storageData });
          break;

        case 'CLEAR_SCAN_DATA':
          await this.clearScanData();
          sendResponse({ success: true, message: 'Scan data cleared' });
          break;

        case 'PING':
          console.log('🔍 PING received, sending PONG');
          sendResponse({ success: true, message: 'PONG', timestamp: new Date() });
          break;

        case 'SAAS_APPLICATION_DETECTED':
          console.log('🔍 SaaS application detected:', message);
          await this.storeDetectedApplication(message);
          sendResponse({ success: true, message: 'SaaS application stored' });
          break;

        case 'OAUTH_DETECTED':
          console.log('🔍 OAuth provider detected:', message);
          await this.storeOAuthDetection(message);
          sendResponse({ success: true, message: 'OAuth detection stored' });
          break;

        case 'TRACKING_DETECTED':
          console.log('🔍 Tracking script detected:', message);
          await this.storeTrackingDetection(message);
          sendResponse({ success: true, message: 'Tracking detection stored' });
          break;

        case 'SENSITIVE_FORM_DETECTED':
          console.log('🔍 Sensitive form detected:', message);
          await this.storeFormDetection(message);
          sendResponse({ success: true, message: 'Form detection stored' });
          break;

        default:
          console.log('Unknown action:', message.action);
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: (error as Error).message });
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
      
      // Step 1: Collect cookies
      await this.updateProgress('Collecting cookies...', 10);
      const cookies = await this.collectCookies();
      
      // Step 2: Analyze OAuth connections
      await this.updateProgress('Analyzing OAuth connections...', 30);
      const oauthData = await this.analyzeOAuthConnections();
      
      // Step 3: Check browsing history for SaaS applications
      await this.updateProgress('Analyzing browsing history for SaaS applications...', 50);
      const historyData = await this.analyzeBrowsingHistory();
      
      // Step 4: Detect tracking scripts
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
    await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause for UI
  }

  private async collectCookies(): Promise<CookieData[]> {
    try {
      const cookies = await chrome.cookies.getAll({});
      console.log(`Collected ${cookies.length} cookies`);
      
      return cookies.map(cookie => ({
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

      // Get recent browsing history (last 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const history = await chrome.history.search({
        text: '',
        startTime: thirtyDaysAgo,
        maxResults: 1000
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

      history.forEach(item => {
        if (item.url) {
          const domain = new URL(item.url).hostname;
          domainStats.set(domain, (domainStats.get(domain) || 0) + 1);
          
          // Check if this domain looks like a SaaS application
          const isSaaS = saasPatterns.some(pattern => 
            domain.includes(pattern) || item.title?.toLowerCase().includes(pattern)
          );
          
          const shouldSkip = skipDomains.some(skip => domain.includes(skip));
          
          if (isSaaS && !shouldSkip) {
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

      console.log(`Analyzed ${history.length} history items from ${domainStats.size} domains`);
      console.log(`Found ${saasApplications.length} potential SaaS applications`);
      
      return {
        totalVisits: history.length,
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
