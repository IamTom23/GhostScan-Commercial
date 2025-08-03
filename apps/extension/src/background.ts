// GhostScan Browser Extension - Background Service Worker

class GhostScanBackground {
  private visitedDomains: Set<string> = new Set();
  private scanProgress: number = 0;
  private isScanning: boolean = false;

  constructor() {
    this.initializeListeners();
    this.initializeNavigationTracking();
    this.initializeCookieTracking();
  }

  private initializeListeners() {
    // Handle messages from popup and content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Background received message:', message);
      
      switch (message.action) {
        case 'START_SCAN':
          this.startScan().then(sendResponse);
          return true;
        
        case 'GET_SCAN_STATUS':
          sendResponse({ 
            isScanning: this.isScanning, 
            progress: this.scanProgress 
          });
          return true;
        
        case 'GET_VISITED_DOMAINS':
          sendResponse({ domains: Array.from(this.visitedDomains) });
          return true;
        
        case 'ANALYZE_PAGE':
          this.analyzeCurrentPage(sender.tab?.id).then(sendResponse);
          return true;
        
        case 'GET_COOKIE_DATA':
          this.getCookieData().then(sendResponse);
          return true;
        
        case 'CLEAR_TRACKING_COOKIES':
          this.clearTrackingCookies().then(sendResponse);
          return true;
        
        case 'GET_BROWSING_HISTORY':
          this.analyzeBrowsingHistory().then(sendResponse);
          return true;
        
        case 'TEST_CONNECTION':
          sendResponse({ success: true, message: 'Background script is running' });
          return true;
        
        default:
          sendResponse({ error: 'Unknown action' });
          return true;
      }
    });

    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      console.log('Extension installed:', details);
      if (details.reason === 'install') {
        this.initializeExtension();
      }
    });
  }

  private initializeNavigationTracking() {
    // Track navigation to build domain history
    chrome.webNavigation.onCompleted.addListener((details) => {
      if (details.url) {
        const domain = new URL(details.url).hostname;
        this.visitedDomains.add(domain);
        console.log('Tracked domain:', domain);
      }
    });
  }

  private initializeCookieTracking() {
    // Track cookie changes
    chrome.cookies.onChanged.addListener((changeInfo) => {
      console.log('Cookie changed:', changeInfo);
    });
  }

  private async initializeExtension() {
    console.log('Initializing GhostScan extension...');
    
    // Set initial data
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
    
    console.log('Extension initialized successfully');
  }

  private async startScan(): Promise<any> {
    if (this.isScanning) {
      return { success: false, error: 'Scan already in progress' };
    }

    this.isScanning = true;
    this.scanProgress = 0;

    try {
      console.log('Starting privacy scan...');
      
      // Update progress
      this.updateProgress(10, 'Initializing scan...');

      // Get current tab
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!currentTab?.id) {
        throw new Error('No active tab found');
      }

      this.updateProgress(20, 'Analyzing current page...');

      // Analyze current page
      const pageAnalysis = await this.analyzeCurrentPage(currentTab.id);
      
      this.updateProgress(40, 'Collecting cookies...');

      // Collect cookies
      const cookieData = await this.getCookieData();
      
      this.updateProgress(60, 'Analyzing browsing history...');

      // Analyze browsing history
      const historyData = await this.analyzeBrowsingHistory();
      
      this.updateProgress(80, 'Processing results...');

      // Combine all data
      const scanResult = {
        timestamp: Date.now(),
        currentPage: pageAnalysis,
        cookies: cookieData,
        history: historyData,
        visitedDomains: Array.from(this.visitedDomains),
        apps: [
          ...pageAnalysis.detectedApplications,
          ...historyData.saasApplications
        ],
        totalRiskScore: this.calculateRiskScore(pageAnalysis, cookieData, historyData),
        trackingData: cookieData.trackingCookies
      };

      this.updateProgress(90, 'Saving results...');

      // Save results
      await chrome.storage.local.set({
        lastScan: Date.now(),
        scanResult: scanResult,
        detectedApplications: scanResult.apps,
        privacyScore: Math.max(0, 100 - scanResult.totalRiskScore)
      });

      this.updateProgress(100, 'Scan completed!');

      console.log('Scan completed successfully:', scanResult);
      
      return { success: true, data: scanResult };

    } catch (error) {
      console.error('Scan failed:', error);
      return { success: false, error: error.message };
    } finally {
      this.isScanning = false;
      this.scanProgress = 0;
    }
  }

  private updateProgress(progress: number, message: string) {
    this.scanProgress = progress;
    console.log(`Progress ${progress}%: ${message}`);
    
    // Send progress update to popup if it's open
    chrome.runtime.sendMessage({
      action: 'SCAN_PROGRESS',
      progress: progress,
      message: message
    }).catch(() => {
      // Popup might not be open, ignore error
    });
  }

  private async analyzeCurrentPage(tabId: number): Promise<any> {
    try {
      // Inject content script to analyze current page
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => {
          // This function runs in the context of the web page
          const analysis = {
            url: window.location.href,
            domain: window.location.hostname,
            title: document.title,
            detectedApplications: [],
            oauthElements: [],
            trackingScripts: [],
            formFields: [],
            riskFactors: []
          };

          // Detect OAuth elements
          const oauthButtons = document.querySelectorAll('button[data-provider], .oauth-button, [class*="oauth"], [class*="google"], [class*="facebook"], [class*="github"]');
          oauthButtons.forEach(button => {
            analysis.oauthElements.push({
              type: 'oauth_button',
              text: button.textContent?.trim(),
              provider: button.getAttribute('data-provider') || this.detectProvider(button)
            });
          });

          // Detect tracking scripts
          const scripts = document.querySelectorAll('script[src]');
          scripts.forEach(script => {
            const src = script.getAttribute('src') || '';
            if (src.includes('google-analytics') || src.includes('facebook') || src.includes('hotjar') || src.includes('mixpanel')) {
              analysis.trackingScripts.push({
                type: 'tracking_script',
                src: src,
                provider: this.detectTrackingProvider(src)
              });
            }
          });

          // Detect form fields
          const forms = document.querySelectorAll('form');
          forms.forEach(form => {
            const inputs = form.querySelectorAll('input[type="email"], input[type="password"], input[name*="email"], input[name*="password"]');
            inputs.forEach(input => {
              analysis.formFields.push({
                type: input.type,
                name: input.name,
                placeholder: input.placeholder
              });
            });
          });

          // Detect SaaS applications
          const domain = window.location.hostname;
          const commonSaaS = [
            { name: 'Google Workspace', domains: ['gmail.com', 'google.com', 'docs.google.com'] },
            { name: 'Microsoft 365', domains: ['outlook.com', 'office.com', 'microsoft.com'] },
            { name: 'Slack', domains: ['slack.com'] },
            { name: 'Zoom', domains: ['zoom.us'] },
            { name: 'Notion', domains: ['notion.so'] },
            { name: 'Figma', domains: ['figma.com'] },
            { name: 'Trello', domains: ['trello.com'] },
            { name: 'Asana', domains: ['asana.com'] },
            { name: 'Dropbox', domains: ['dropbox.com'] },
            { name: 'Box', domains: ['box.com'] }
          ];

          const detectedSaaS = commonSaaS.find(saas => 
            saas.domains.some(saasDomain => domain.includes(saasDomain))
          );

          if (detectedSaaS) {
            analysis.detectedApplications.push({
              name: detectedSaaS.name,
              domain: domain,
              type: 'saas',
              riskLevel: 'LOW',
              dataTypes: ['account_info', 'usage_data'],
              oauthProvider: analysis.oauthElements.length > 0 ? 'detected' : null
            });
          }

          // Calculate risk factors
          if (analysis.oauthElements.length > 0) {
            analysis.riskFactors.push('oauth_connections');
          }
          if (analysis.trackingScripts.length > 0) {
            analysis.riskFactors.push('tracking_scripts');
          }
          if (analysis.formFields.length > 0) {
            analysis.riskFactors.push('sensitive_forms');
          }

          return analysis;
        }
      });

      return results[0]?.result || { detectedApplications: [], oauthElements: [], trackingScripts: [], formFields: [], riskFactors: [] };

    } catch (error) {
      console.error('Error analyzing current page:', error);
      return { detectedApplications: [], oauthElements: [], trackingScripts: [], formFields: [], riskFactors: [] };
    }
  }

  private async getCookieData(): Promise<any> {
    try {
      const allCookies = await chrome.cookies.getAll({});
      
      const trackingCookies = allCookies.filter(cookie => 
        cookie.name.includes('_ga') || 
        cookie.name.includes('_fbp') || 
        cookie.name.includes('_gid') ||
        cookie.domain.includes('google-analytics') ||
        cookie.domain.includes('facebook') ||
        cookie.domain.includes('doubleclick')
      );

      return {
        totalCookies: allCookies.length,
        trackingCookies: trackingCookies,
        trackingDomains: [...new Set(trackingCookies.map(c => c.domain))]
      };
    } catch (error) {
      console.error('Error getting cookie data:', error);
      return { totalCookies: 0, trackingCookies: [], trackingDomains: [] };
    }
  }

  private async clearTrackingCookies(): Promise<any> {
    try {
      const allCookies = await chrome.cookies.getAll({});
      const trackingCookies = allCookies.filter(cookie => 
        cookie.name.includes('_ga') || 
        cookie.name.includes('_fbp') || 
        cookie.name.includes('_gid') ||
        cookie.domain.includes('google-analytics') ||
        cookie.domain.includes('facebook') ||
        cookie.domain.includes('doubleclick')
      );

      let removedCount = 0;
      for (const cookie of trackingCookies) {
        try {
          await chrome.cookies.remove({
            url: `https://${cookie.domain}${cookie.path}`,
            name: cookie.name
          });
          removedCount++;
        } catch (error) {
          console.log('Failed to remove cookie:', cookie.name);
        }
      }

      return { success: true, removedCount };
    } catch (error) {
      console.error('Error clearing tracking cookies:', error);
      return { success: false, error: error.message };
    }
  }

  private async analyzeBrowsingHistory(): Promise<any> {
    try {
      // Get recent browsing history (last 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const history = await chrome.history.search({
        text: '',
        startTime: thirtyDaysAgo,
        maxResults: 1000
      });

      const saasApplications = [];
      const visitedDomains = new Set();

      // Common SaaS domains
      const saasDomains = {
        'gmail.com': { name: 'Gmail', type: 'email', riskLevel: 'LOW' },
        'outlook.com': { name: 'Outlook', type: 'email', riskLevel: 'LOW' },
        'slack.com': { name: 'Slack', type: 'communication', riskLevel: 'LOW' },
        'zoom.us': { name: 'Zoom', type: 'video', riskLevel: 'MEDIUM' },
        'notion.so': { name: 'Notion', type: 'productivity', riskLevel: 'LOW' },
        'figma.com': { name: 'Figma', type: 'design', riskLevel: 'LOW' },
        'trello.com': { name: 'Trello', type: 'project_management', riskLevel: 'LOW' },
        'asana.com': { name: 'Asana', type: 'project_management', riskLevel: 'LOW' },
        'dropbox.com': { name: 'Dropbox', type: 'storage', riskLevel: 'MEDIUM' },
        'box.com': { name: 'Box', type: 'storage', riskLevel: 'MEDIUM' },
        'github.com': { name: 'GitHub', type: 'development', riskLevel: 'LOW' },
        'gitlab.com': { name: 'GitLab', type: 'development', riskLevel: 'LOW' },
        'bitbucket.org': { name: 'Bitbucket', type: 'development', riskLevel: 'LOW' },
        'jira.com': { name: 'Jira', type: 'project_management', riskLevel: 'LOW' },
        'confluence.com': { name: 'Confluence', type: 'documentation', riskLevel: 'LOW' },
        'salesforce.com': { name: 'Salesforce', type: 'crm', riskLevel: 'MEDIUM' },
        'hubspot.com': { name: 'HubSpot', type: 'marketing', riskLevel: 'MEDIUM' },
        'mailchimp.com': { name: 'Mailchimp', type: 'email_marketing', riskLevel: 'MEDIUM' },
        'stripe.com': { name: 'Stripe', type: 'payment', riskLevel: 'HIGH' },
        'paypal.com': { name: 'PayPal', type: 'payment', riskLevel: 'HIGH' },
        'shopify.com': { name: 'Shopify', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'wordpress.com': { name: 'WordPress', type: 'cms', riskLevel: 'LOW' },
        'wix.com': { name: 'Wix', type: 'website_builder', riskLevel: 'LOW' },
        'squarespace.com': { name: 'Squarespace', type: 'website_builder', riskLevel: 'LOW' },
        'canva.com': { name: 'Canva', type: 'design', riskLevel: 'LOW' },
        'airtable.com': { name: 'Airtable', type: 'database', riskLevel: 'MEDIUM' },
        'zapier.com': { name: 'Zapier', type: 'automation', riskLevel: 'MEDIUM' },
        'ifttt.com': { name: 'IFTTT', type: 'automation', riskLevel: 'MEDIUM' },
        'calendly.com': { name: 'Calendly', type: 'scheduling', riskLevel: 'LOW' },
        'typeform.com': { name: 'Typeform', type: 'forms', riskLevel: 'MEDIUM' },
        'survey-monkey.com': { name: 'SurveyMonkey', type: 'surveys', riskLevel: 'MEDIUM' },
        'intercom.com': { name: 'Intercom', type: 'customer_support', riskLevel: 'MEDIUM' },
        'zendesk.com': { name: 'Zendesk', type: 'customer_support', riskLevel: 'LOW' },
        'freshdesk.com': { name: 'Freshdesk', type: 'customer_support', riskLevel: 'LOW' },
        'pipedrive.com': { name: 'Pipedrive', type: 'crm', riskLevel: 'MEDIUM' },
        'monday.com': { name: 'Monday.com', type: 'project_management', riskLevel: 'LOW' },
        'clickup.com': { name: 'ClickUp', type: 'project_management', riskLevel: 'LOW' },
        'linear.app': { name: 'Linear', type: 'project_management', riskLevel: 'LOW' },
        'notion.so': { name: 'Notion', type: 'productivity', riskLevel: 'LOW' },
        'roamresearch.com': { name: 'Roam Research', type: 'productivity', riskLevel: 'LOW' },
        'obsidian.md': { name: 'Obsidian', type: 'productivity', riskLevel: 'LOW' },
        'logseq.com': { name: 'Logseq', type: 'productivity', riskLevel: 'LOW' },
        'evernote.com': { name: 'Evernote', type: 'productivity', riskLevel: 'LOW' },
        'onenote.com': { name: 'OneNote', type: 'productivity', riskLevel: 'LOW' },
        'bear.app': { name: 'Bear', type: 'productivity', riskLevel: 'LOW' },
        'ulysses.app': { name: 'Ulysses', type: 'productivity', riskLevel: 'LOW' },
        'scrivener.com': { name: 'Scrivener', type: 'productivity', riskLevel: 'LOW' },
        'grammarly.com': { name: 'Grammarly', type: 'writing', riskLevel: 'MEDIUM' },
        'hemingwayapp.com': { name: 'Hemingway Editor', type: 'writing', riskLevel: 'LOW' },
        'prowritingaid.com': { name: 'ProWritingAid', type: 'writing', riskLevel: 'MEDIUM' },
        'white-smoke.com': { name: 'WhiteSmoke', type: 'writing', riskLevel: 'MEDIUM' },
        'ginger-software.com': { name: 'Ginger', type: 'writing', riskLevel: 'MEDIUM' },
        'language-tool.org': { name: 'LanguageTool', type: 'writing', riskLevel: 'LOW' },
        'scribens.com': { name: 'Scribens', type: 'writing', riskLevel: 'LOW' },
        'reverso.net': { name: 'Reverso', type: 'translation', riskLevel: 'LOW' },
        'deepl.com': { name: 'DeepL', type: 'translation', riskLevel: 'LOW' },
        'translate.google.com': { name: 'Google Translate', type: 'translation', riskLevel: 'LOW' },
        'bing.com/translator': { name: 'Bing Translator', type: 'translation', riskLevel: 'LOW' },
        'yandex.com/translate': { name: 'Yandex Translate', type: 'translation', riskLevel: 'LOW' },
        'libretranslate.com': { name: 'LibreTranslate', type: 'translation', riskLevel: 'LOW' },
        'papago.naver.com': { name: 'Papago', type: 'translation', riskLevel: 'LOW' },
        'baidu.com/translate': { name: 'Baidu Translate', type: 'translation', riskLevel: 'LOW' },
        'tencent.com/translate': { name: 'Tencent Translate', type: 'translation', riskLevel: 'LOW' },
        'alibaba.com': { name: 'Alibaba', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'amazon.com': { name: 'Amazon', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'ebay.com': { name: 'eBay', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'etsy.com': { name: 'Etsy', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'walmart.com': { name: 'Walmart', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'target.com': { name: 'Target', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'bestbuy.com': { name: 'Best Buy', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'homedepot.com': { name: 'Home Depot', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'lowes.com': { name: 'Lowe\'s', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'costco.com': { name: 'Costco', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'samsclub.com': { name: 'Sam\'s Club', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'kroger.com': { name: 'Kroger', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'safeway.com': { name: 'Safeway', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'wegmans.com': { name: 'Wegmans', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'publix.com': { name: 'Publix', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'meijer.com': { name: 'Meijer', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'hy-vee.com': { name: 'Hy-Vee', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'foodlion.com': { name: 'Food Lion', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'gianteagle.com': { name: 'Giant Eagle', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'shoprite.com': { name: 'ShopRite', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'stopandshop.com': { name: 'Stop & Shop', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'giantfood.com': { name: 'Giant Food', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'acme.com': { name: 'Acme', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'shaws.com': { name: 'Shaw\'s', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'star-market.com': { name: 'Star Market', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'hannaford.com': { name: 'Hannaford', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'pricechopper.com': { name: 'Price Chopper', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'topsmarkets.com': { name: 'Tops Markets', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'wegmans.com': { name: 'Wegmans', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'publix.com': { name: 'Publix', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'meijer.com': { name: 'Meijer', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'hy-vee.com': { name: 'Hy-Vee', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'foodlion.com': { name: 'Food Lion', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'gianteagle.com': { name: 'Giant Eagle', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'shoprite.com': { name: 'ShopRite', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'stopandshop.com': { name: 'Stop & Shop', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'giantfood.com': { name: 'Giant Food', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'acme.com': { name: 'Acme', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'shaws.com': { name: 'Shaw\'s', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'star-market.com': { name: 'Star Market', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'hannaford.com': { name: 'Hannaford', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'pricechopper.com': { name: 'Price Chopper', type: 'ecommerce', riskLevel: 'MEDIUM' },
        'topsmarkets.com': { name: 'Tops Markets', type: 'ecommerce', riskLevel: 'MEDIUM' }
      };

      history.forEach(item => {
        if (item.url) {
          const domain = new URL(item.url).hostname;
          visitedDomains.add(domain);

          // Check if it's a SaaS application
          for (const [saasDomain, saasInfo] of Object.entries(saasDomains)) {
            if (domain.includes(saasDomain)) {
              const existingApp = saasApplications.find(app => app.name === saasInfo.name);
              if (!existingApp) {
                saasApplications.push({
                  name: saasInfo.name,
                  domain: domain,
                  type: saasInfo.type,
                  riskLevel: saasInfo.riskLevel,
                  dataTypes: ['account_info', 'usage_data'],
                  visitCount: 1,
                  lastVisit: item.lastVisitTime,
                  oauthProvider: null
                });
              } else {
                existingApp.visitCount++;
                if (item.lastVisitTime > existingApp.lastVisit) {
                  existingApp.lastVisit = item.lastVisitTime;
                }
              }
              break;
            }
          }
        }
      });

      return {
        totalVisits: history.length,
        uniqueDomains: visitedDomains.size,
        saasApplications: saasApplications,
        mostVisitedDomains: Array.from(visitedDomains).slice(0, 10)
      };

    } catch (error) {
      console.error('Error analyzing browsing history:', error);
      return {
        totalVisits: 0,
        uniqueDomains: 0,
        saasApplications: [],
        mostVisitedDomains: []
      };
    }
  }

  private calculateRiskScore(pageAnalysis: any, cookieData: any, historyData: any): number {
    let riskScore = 0;

    // Page analysis risks
    if (pageAnalysis.oauthElements.length > 0) riskScore += 10;
    if (pageAnalysis.trackingScripts.length > 0) riskScore += 15;
    if (pageAnalysis.formFields.length > 0) riskScore += 5;

    // Cookie risks
    if (cookieData.trackingCookies.length > 10) riskScore += 20;
    if (cookieData.trackingDomains.length > 5) riskScore += 15;

    // History risks
    const highRiskApps = historyData.saasApplications.filter((app: any) => 
      app.riskLevel === 'HIGH' || app.riskLevel === 'CRITICAL'
    );
    riskScore += highRiskApps.length * 5;

    return Math.min(100, riskScore);
  }
}

// Initialize the background service worker
new GhostScanBackground();
