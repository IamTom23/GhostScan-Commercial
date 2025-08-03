// GhostScan Browser Extension - Content Script

class GhostScanContent {
  private isInitialized: boolean = false;
  private detectedApplications: any[] = [];
  private oauthDetections: any[] = [];
  private trackingDetections: any[] = [];
  private formDetections: any[] = [];

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.isInitialized) return;
    
    console.log('GhostScan content script initialized');
    this.isInitialized = true;

    // Run initial detection
    this.detectOAuthElements();
    this.detectTrackingScripts();
    this.detectFormFields();
    this.detectSaaSApplication();

    // Set up mutation observer to detect dynamic content
    this.setupMutationObserver();

    // Listen for messages from background script
    this.setupMessageListener();
  }

  private setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // New elements added, run detection again
          this.detectOAuthElements();
          this.detectTrackingScripts();
          this.detectFormFields();
          this.detectSaaSApplication();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Content script received message:', message);
      
      switch (message.action) {
        case 'ANALYZE_PAGE':
          const analysis = this.analyzePage();
          sendResponse(analysis);
          break;
        
        case 'GET_DETECTIONS':
          sendResponse({
            applications: this.detectedApplications,
            oauth: this.oauthDetections,
            tracking: this.trackingDetections,
            forms: this.formDetections
          });
          break;
        
        case 'CLEAR_DETECTIONS':
          this.clearDetections();
          sendResponse({ success: true });
          break;
        
        default:
          sendResponse({ error: 'Unknown action' });
      }
    });
  }

  private detectOAuthElements() {
    const oauthSelectors = [
      'button[data-provider]',
      '.oauth-button',
      '[class*="oauth"]',
      '[class*="google"]',
      '[class*="facebook"]',
      '[class*="github"]',
      '[class*="twitter"]',
      '[class*="linkedin"]',
      '[class*="microsoft"]',
      '[class*="apple"]'
    ];

    oauthSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const provider = this.detectOAuthProvider(element);
        if (provider) {
          this.oauthDetections.push({
            provider: provider,
            element: element.tagName,
            text: element.textContent?.trim(),
            url: window.location.href,
            timestamp: new Date().toISOString()
          });

          // Send to background script
          chrome.runtime.sendMessage({
            action: 'OAUTH_DETECTED',
            provider: provider,
            url: window.location.href
          });
        }
      });
    });
  }

  private detectTrackingScripts() {
    const scripts = document.querySelectorAll('script[src]');
    const trackingPatterns = [
      'google-analytics',
      'facebook',
      'hotjar',
      'mixpanel',
      'amplitude',
      'segment',
      'gtag',
      'googletagmanager',
      'doubleclick',
      'adwords',
      'bing',
      'twitter',
      'linkedin',
      'pinterest',
      'tiktok',
      'snapchat'
    ];

    scripts.forEach(script => {
      const src = script.getAttribute('src') || '';
      const trackingPattern = trackingPatterns.find(pattern => 
        src.includes(pattern)
      );

      if (trackingPattern) {
        this.trackingDetections.push({
          tracker: trackingPattern,
          src: src,
          url: window.location.href,
          timestamp: new Date().toISOString()
        });

        // Send to background script
        chrome.runtime.sendMessage({
          action: 'TRACKING_DETECTED',
          tracker: trackingPattern,
          url: window.location.href
        });
      }
    });
  }

  private detectFormFields() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const sensitiveInputs = form.querySelectorAll('input[type="email"], input[type="password"], input[name*="email"], input[name*="password"], input[name*="phone"], input[name*="credit"], input[name*="card"]');
      
      if (sensitiveInputs.length > 0) {
        const fields = Array.from(sensitiveInputs).map(input => ({
          type: input.getAttribute('type') || 'text',
          name: input.getAttribute('name') || '',
          placeholder: input.getAttribute('placeholder') || ''
        }));

        this.formDetections.push({
          fields: fields,
          url: window.location.href,
          timestamp: new Date().toISOString()
        });

        // Send to background script
        chrome.runtime.sendMessage({
          action: 'SENSITIVE_FORM_DETECTED',
          fields: fields,
          url: window.location.href
        });
      }
    });
  }

  private detectSaaSApplication() {
    const domain = window.location.hostname;
    const title = document.title;
    const url = window.location.href;

    // Common SaaS application patterns
    const saasPatterns = [
      { name: 'Google Workspace', patterns: ['gmail.com', 'google.com', 'docs.google.com', 'drive.google.com'] },
      { name: 'Microsoft 365', patterns: ['outlook.com', 'office.com', 'microsoft.com', 'onedrive.com'] },
      { name: 'Slack', patterns: ['slack.com'] },
      { name: 'Discord', patterns: ['discord.com'] },
      { name: 'Zoom', patterns: ['zoom.us'] },
      { name: 'Teams', patterns: ['teams.microsoft.com'] },
      { name: 'Notion', patterns: ['notion.so'] },
      { name: 'Figma', patterns: ['figma.com'] },
      { name: 'Trello', patterns: ['trello.com'] },
      { name: 'Asana', patterns: ['asana.com'] },
      { name: 'Monday.com', patterns: ['monday.com'] },
      { name: 'ClickUp', patterns: ['clickup.com'] },
      { name: 'Airtable', patterns: ['airtable.com'] },
      { name: 'Dropbox', patterns: ['dropbox.com'] },
      { name: 'Box', patterns: ['box.com'] },
      { name: 'GitHub', patterns: ['github.com'] },
      { name: 'GitLab', patterns: ['gitlab.com'] },
      { name: 'Bitbucket', patterns: ['bitbucket.org'] },
      { name: 'Jira', patterns: ['jira.com'] },
      { name: 'Confluence', patterns: ['confluence.com'] },
      { name: 'Salesforce', patterns: ['salesforce.com'] },
      { name: 'HubSpot', patterns: ['hubspot.com'] },
      { name: 'Mailchimp', patterns: ['mailchimp.com'] },
      { name: 'Stripe', patterns: ['stripe.com'] },
      { name: 'PayPal', patterns: ['paypal.com'] },
      { name: 'Shopify', patterns: ['shopify.com'] },
      { name: 'WordPress', patterns: ['wordpress.com'] },
      { name: 'Wix', patterns: ['wix.com'] },
      { name: 'Squarespace', patterns: ['squarespace.com'] },
      { name: 'Canva', patterns: ['canva.com'] },
      { name: 'Zapier', patterns: ['zapier.com'] },
      { name: 'IFTTT', patterns: ['ifttt.com'] },
      { name: 'Calendly', patterns: ['calendly.com'] },
      { name: 'Typeform', patterns: ['typeform.com'] },
      { name: 'SurveyMonkey', patterns: ['survey-monkey.com'] },
      { name: 'Intercom', patterns: ['intercom.com'] },
      { name: 'Zendesk', patterns: ['zendesk.com'] },
      { name: 'Freshdesk', patterns: ['freshdesk.com'] },
      { name: 'Pipedrive', patterns: ['pipedrive.com'] },
      { name: 'Linear', patterns: ['linear.app'] },
      { name: 'Roam Research', patterns: ['roamresearch.com'] },
      { name: 'Obsidian', patterns: ['obsidian.md'] },
      { name: 'Logseq', patterns: ['logseq.com'] },
      { name: 'Evernote', patterns: ['evernote.com'] },
      { name: 'OneNote', patterns: ['onenote.com'] },
      { name: 'Bear', patterns: ['bear.app'] },
      { name: 'Ulysses', patterns: ['ulysses.app'] },
      { name: 'Scrivener', patterns: ['scrivener.com'] },
      { name: 'Grammarly', patterns: ['grammarly.com'] },
      { name: 'Hemingway Editor', patterns: ['hemingwayapp.com'] },
      { name: 'ProWritingAid', patterns: ['prowritingaid.com'] },
      { name: 'WhiteSmoke', patterns: ['white-smoke.com'] },
      { name: 'Ginger', patterns: ['ginger-software.com'] },
      { name: 'LanguageTool', patterns: ['language-tool.org'] },
      { name: 'Scribens', patterns: ['scribens.com'] },
      { name: 'Reverso', patterns: ['reverso.net'] },
      { name: 'DeepL', patterns: ['deepl.com'] },
      { name: 'Google Translate', patterns: ['translate.google.com'] },
      { name: 'Bing Translator', patterns: ['bing.com/translator'] },
      { name: 'Yandex Translate', patterns: ['yandex.com/translate'] },
      { name: 'LibreTranslate', patterns: ['libretranslate.com'] },
      { name: 'Papago', patterns: ['papago.naver.com'] },
      { name: 'Baidu Translate', patterns: ['baidu.com/translate'] },
      { name: 'Tencent Translate', patterns: ['tencent.com/translate'] }
    ];

    // Check if current domain matches any SaaS pattern
    const matchedSaaS = saasPatterns.find(saas => 
      saas.patterns.some(pattern => domain.includes(pattern))
    );

    if (matchedSaaS) {
      const riskLevel = this.calculateRiskLevel(matchedSaaS.name, domain);
      const dataTypes = this.getDataTypes(matchedSaaS.name);
      const riskFactors = this.getRiskFactors(matchedSaaS.name, domain);

      const saasApp = {
        name: matchedSaaS.name,
        domain: domain,
        title: title,
        url: url,
        riskLevel: riskLevel,
        dataTypes: dataTypes,
        riskFactors: riskFactors,
        oauthProvider: this.oauthDetections.length > 0 ? 'detected' : null,
        timestamp: new Date().toISOString()
      };

      this.detectedApplications.push(saasApp);

      // Send to background script
      chrome.runtime.sendMessage({
        action: 'SAAS_APPLICATION_DETECTED',
        ...saasApp
      });
    }
  }

  private detectOAuthProvider(element: Element): string | null {
    const text = element.textContent?.toLowerCase() || '';
    const className = element.className?.toLowerCase() || '';
    const id = element.id?.toLowerCase() || '';

    if (text.includes('google') || className.includes('google') || id.includes('google')) {
      return 'google';
    }
    if (text.includes('facebook') || className.includes('facebook') || id.includes('facebook')) {
      return 'facebook';
    }
    if (text.includes('github') || className.includes('github') || id.includes('github')) {
      return 'github';
    }
    if (text.includes('twitter') || className.includes('twitter') || id.includes('twitter')) {
      return 'twitter';
    }
    if (text.includes('linkedin') || className.includes('linkedin') || id.includes('linkedin')) {
      return 'linkedin';
    }
    if (text.includes('microsoft') || className.includes('microsoft') || id.includes('microsoft')) {
      return 'microsoft';
    }
    if (text.includes('apple') || className.includes('apple') || id.includes('apple')) {
      return 'apple';
    }

    return null;
  }

  private calculateRiskLevel(appName: string, domain: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // High-risk applications
    const highRiskApps = ['Stripe', 'PayPal', 'Salesforce', 'HubSpot'];
    if (highRiskApps.includes(appName)) {
      return 'HIGH';
    }

    // Critical risk applications (Chinese-owned or AI/ML focused)
    const criticalRiskApps = ['DeepSeek', 'Claude', 'Perplexity', 'Anthropic', 'OpenAI', 'ChatGPT'];
    if (criticalRiskApps.includes(appName)) {
      return 'CRITICAL';
    }

    // Check for Chinese domains
    const chineseDomains = ['deepseek', 'baidu', 'alibaba', 'tencent', 'bytedance'];
    if (chineseDomains.some(chinese => domain.includes(chinese))) {
      return 'CRITICAL';
    }

    // Medium risk applications
    const mediumRiskApps = ['Dropbox', 'Box', 'Mailchimp', 'Intercom', 'Zapier', 'IFTTT'];
    if (mediumRiskApps.includes(appName)) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  private getDataTypes(appName: string): string[] {
    const dataTypes: { [key: string]: string[] } = {
      'Google Workspace': ['email', 'documents', 'calendar', 'drive', 'profile'],
      'Microsoft 365': ['email', 'documents', 'calendar', 'onedrive', 'profile'],
      'Slack': ['messages', 'files', 'profile', 'contacts'],
      'Discord': ['messages', 'voice', 'profile', 'contacts'],
      'Zoom': ['video', 'audio', 'profile', 'contacts'],
      'Notion': ['documents', 'data', 'profile'],
      'Figma': ['designs', 'files', 'profile'],
      'Trello': ['tasks', 'boards', 'profile'],
      'Asana': ['tasks', 'projects', 'profile'],
      'Dropbox': ['files', 'profile'],
      'Box': ['files', 'profile'],
      'GitHub': ['code', 'repositories', 'profile'],
      'Salesforce': ['crm_data', 'contacts', 'profile'],
      'HubSpot': ['marketing_data', 'contacts', 'profile'],
      'Stripe': ['payment_data', 'financial', 'profile'],
      'PayPal': ['payment_data', 'financial', 'profile'],
      'Shopify': ['ecommerce_data', 'customers', 'profile'],
      'Mailchimp': ['email_lists', 'marketing_data', 'profile'],
      'Intercom': ['customer_data', 'messages', 'profile'],
      'Zapier': ['automation_data', 'integrations', 'profile'],
      'IFTTT': ['automation_data', 'integrations', 'profile']
    };

    return dataTypes[appName] || ['account_info', 'usage_data'];
  }

  private getRiskFactors(appName: string, domain: string): string[] {
    const riskFactors: string[] = [];

    // Check for third-party cookies
    if (this.trackingDetections.length > 0) {
      riskFactors.push('THIRD_PARTY_COOKIES');
    }

    // Check for OAuth connections
    if (this.oauthDetections.length > 0) {
      riskFactors.push('OAUTH_CONNECTIONS');
    }

    // Check for sensitive forms
    if (this.formDetections.length > 0) {
      riskFactors.push('SENSITIVE_FORMS');
    }

    // Check for Chinese ownership
    const chineseDomains = ['deepseek', 'baidu', 'alibaba', 'tencent', 'bytedance'];
    if (chineseDomains.some(chinese => domain.includes(chinese))) {
      riskFactors.push('CHINESE_OWNED');
    }

    // Check for AI/ML applications
    const aiApps = ['DeepSeek', 'Claude', 'Perplexity', 'Anthropic', 'OpenAI', 'ChatGPT'];
    if (aiApps.includes(appName)) {
      riskFactors.push('AI_ML_PROCESSING');
    }

    // Check for financial applications
    const financialApps = ['Stripe', 'PayPal', 'Shopify'];
    if (financialApps.includes(appName)) {
      riskFactors.push('FINANCIAL_DATA');
    }

    return riskFactors;
  }

  private analyzePage() {
    return {
      url: window.location.href,
      domain: window.location.hostname,
      title: document.title,
      detectedApplications: this.detectedApplications,
      oauthElements: this.oauthDetections,
      trackingScripts: this.trackingDetections,
      formFields: this.formDetections,
      riskFactors: this.getPageRiskFactors()
    };
  }

  private getPageRiskFactors(): string[] {
    const riskFactors: string[] = [];

    if (this.oauthDetections.length > 0) {
      riskFactors.push('oauth_connections');
    }
    if (this.trackingDetections.length > 0) {
      riskFactors.push('tracking_scripts');
    }
    if (this.formDetections.length > 0) {
      riskFactors.push('sensitive_forms');
    }
    if (this.detectedApplications.length > 0) {
      riskFactors.push('saas_applications');
    }

    return riskFactors;
  }

  private clearDetections() {
    this.detectedApplications = [];
    this.oauthDetections = [];
    this.trackingDetections = [];
    this.formDetections = [];
  }
}

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new GhostScanContent();
  });
} else {
  new GhostScanContent();
} 