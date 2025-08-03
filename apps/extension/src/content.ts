// GhostScan Browser Extension - Content Script

console.log('🔍 GhostScan Content Script loaded');

// Add a marker to indicate the content script is running
document.documentElement.setAttribute('data-ghostscan', 'loaded');

// Add a global property to indicate extension is available
(window as any).ghostScanExtension = {
  version: '1.0.1',
  available: true
};

// Performance optimization: Throttling and debouncing
let isProcessing = false;
let mutationTimeout: number | null = null;
let lastDetectionTime = 0;
const DETECTION_COOLDOWN = 5000; // 5 seconds between detections

// Helper function to safely send messages to background script
function safeSendMessage(message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        reject(new Error('Chrome runtime not available'));
        return;
      }

      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Throttled detection function
function throttledDetection() {
  if (isProcessing) return;
  
  const now = Date.now();
  if (now - lastDetectionTime < DETECTION_COOLDOWN) return;
  
  isProcessing = true;
  lastDetectionTime = now;
  
  try {
    detectOAuthElements();
    detectTrackingScripts();
    detectFormFields();
    detectSaaSApplication();
  } finally {
    isProcessing = false;
  }
}

// Detect OAuth buttons and forms (optimized)
function detectOAuthElements() {
  try {
    // Limit DOM queries to avoid freezing
    const oauthButtons = document.querySelectorAll('button, a, div');
    if (oauthButtons.length > 100) {
      console.log('Too many elements, skipping OAuth detection');
      return;
    }
    
    const oauthProviders = ['google', 'facebook', 'github', 'twitter', 'linkedin'];
    const detectedProviders = new Set<string>();
    
    oauthButtons.forEach(button => {
      if (detectedProviders.size >= 5) return; // Limit to 5 providers max
      
      const text = button.textContent?.toLowerCase() || '';
      const href = (button as HTMLAnchorElement).href?.toLowerCase() || '';
      
      oauthProviders.forEach(provider => {
        if (text.includes(provider) || href.includes(provider)) {
          if (!detectedProviders.has(provider)) {
            detectedProviders.add(provider);
            console.log(`Found OAuth provider: ${provider}`);
            // Send message to background script safely
            safeSendMessage({
              action: 'OAUTH_DETECTED',
              provider: provider,
              url: window.location.href
            }).catch(error => {
              console.log('Failed to send OAuth detection:', error);
            });
          }
        }
      });
    });
  } catch (error) {
    console.log('Error in detectOAuthElements:', error);
  }
}

// Detect tracking scripts (optimized)
function detectTrackingScripts() {
  try {
    const scripts = document.querySelectorAll('script[src]');
    if (scripts.length > 50) {
      console.log('Too many scripts, limiting tracking detection');
      return;
    }
    
    const trackingPatterns = [
      'google-analytics',
      'googletagmanager',
      'facebook.net',
      'doubleclick',
      'hotjar',
      'mixpanel'
    ];
    
    const detectedTrackers = new Set<string>();
    
    scripts.forEach(script => {
      if (detectedTrackers.size >= 10) return; // Limit to 10 trackers max
      
      const src = (script as HTMLScriptElement).src.toLowerCase();
      trackingPatterns.forEach(pattern => {
        if (src.includes(pattern) && !detectedTrackers.has(pattern)) {
          detectedTrackers.add(pattern);
          console.log(`Found tracking script: ${pattern}`);
          safeSendMessage({
            action: 'TRACKING_DETECTED',
            tracker: pattern,
            url: window.location.href
          }).catch(error => {
            console.log('Failed to send tracking detection:', error);
          });
        }
      });
    });
  } catch (error) {
    console.log('Error in detectTrackingScripts:', error);
  }
}

// Detect form fields (optimized)
function detectFormFields() {
  try {
    const forms = document.querySelectorAll('form');
    if (forms.length > 20) {
      console.log('Too many forms, limiting form detection');
      return;
    }
    
    const sensitiveFields = ['email', 'password', 'phone', 'ssn', 'credit'];
    
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input');
      if (inputs.length > 50) return; // Skip forms with too many inputs
      
      const sensitiveData: string[] = [];
      
      inputs.forEach(input => {
        const type = input.type.toLowerCase();
        const name = input.name?.toLowerCase() || '';
        const id = input.id?.toLowerCase() || '';
        
        sensitiveFields.forEach(field => {
          if (type.includes(field) || name.includes(field) || id.includes(field)) {
            sensitiveData.push(field);
          }
        });
      });
      
      if (sensitiveData.length > 0) {
        console.log(`Found sensitive form fields: ${sensitiveData.join(', ')}`);
        safeSendMessage({
          action: 'SENSITIVE_FORM_DETECTED',
          fields: sensitiveData,
          url: window.location.href
        }).catch(error => {
          console.log('Failed to send form detection:', error);
        });
      }
    });
  } catch (error) {
    console.log('Error in detectFormFields:', error);
  }
}

// Detect new SaaS applications (optimized)
function detectSaaSApplication() {
  try {
    const currentUrl = window.location.href;
    const domain = window.location.hostname;
    const title = document.title;
    
    // Skip if it's a common domain we don't want to track
    const skipDomains = [
      'google.com', 'google.co.uk', 'google.ca',
      'facebook.com', 'twitter.com', 'linkedin.com',
      'github.com', 'stackoverflow.com', 'reddit.com',
      'youtube.com', 'amazon.com', 'netflix.com',
      'localhost', '127.0.0.1', 'chrome://', 'chrome-extension://'
    ];
    
    if (skipDomains.some(skip => domain.includes(skip))) {
      return;
    }
    
    // Quick checks to avoid heavy DOM operations
    const hasLoginForm = document.querySelector('input[type="password"], input[name*="password"], input[id*="password"]');
    const hasSignupForm = document.querySelector('input[type="email"], input[name*="email"], input[id*="email"]');
    const hasDashboard = document.querySelector('[class*="dashboard"], [id*="dashboard"], [class*="app"], [id*="app"]');
    const hasUserMenu = document.querySelector('[class*="user"], [id*="user"], [class*="profile"], [id*="profile"]');
    
    if (hasLoginForm || hasSignupForm || hasDashboard || hasUserMenu) {
      console.log(`🔍 Detected potential SaaS application: ${domain}`);
      
      // Analyze the application for risk factors (limited scope)
      const riskFactors = [];
      const dataTypes = [];
      
      // Check for tracking scripts (limited check)
      const trackingScripts = document.querySelectorAll('script[src*="google-analytics"], script[src*="facebook"], script[src*="hotjar"]');
      if (trackingScripts.length > 0) {
        riskFactors.push('TRACKING_SCRIPTS');
        dataTypes.push('tracking');
      }
      
      // Check for third-party cookies (simplified)
      const thirdPartyCookies = document.cookie.split(';').some(cookie => 
        !cookie.includes(domain) && cookie.includes('='));
      if (thirdPartyCookies) {
        riskFactors.push('THIRD_PARTY_COOKIES');
        dataTypes.push('cookies');
      }
      
      // Check for OAuth providers (limited check)
      const oauthProviders = ['google', 'facebook', 'github', 'twitter', 'linkedin'];
      const hasOAuth = oauthProviders.some(provider => 
        document.querySelector(`[href*="${provider}"], [src*="${provider}"]`));
      if (hasOAuth) {
        riskFactors.push('OAUTH_INTEGRATION');
        dataTypes.push('oauth_connection');
      }
      
      // Determine risk level based on factors
      let riskLevel = 'LOW';
      if (riskFactors.includes('TRACKING_SCRIPTS') && riskFactors.includes('THIRD_PARTY_COOKIES')) {
        riskLevel = 'HIGH';
      } else if (riskFactors.length > 1) {
        riskLevel = 'MEDIUM';
      }
      
      // Check for Chinese-owned domains (potential risk factor)
      const chineseDomains = ['deepseek', 'baidu', 'alibaba', 'tencent', 'bytedance', 'sina', 'sohu'];
      if (chineseDomains.some(chinese => domain.includes(chinese))) {
        riskLevel = 'CRITICAL';
        riskFactors.push('CHINESE_OWNED');
        dataTypes.push('international_data_sharing');
      }
      
      // Send the detection to background script
      safeSendMessage({
        action: 'SAAS_APPLICATION_DETECTED',
        domain: domain,
        title: title,
        url: currentUrl,
        riskLevel: riskLevel,
        riskFactors: riskFactors,
        dataTypes: dataTypes,
        hasLoginForm: !!hasLoginForm,
        hasSignupForm: !!hasSignupForm,
        hasDashboard: !!hasDashboard,
        hasUserMenu: !!hasUserMenu,
        timestamp: new Date().toISOString()
      }).catch(error => {
        console.log('Failed to send SaaS application detection:', error);
      });
    }
  } catch (error) {
    console.log('Error in detectSaaSApplication:', error);
  }
}

// Handle communication from the dashboard
async function handleDashboardCommunication(event: CustomEvent) {
  try {
    console.log('🔍 Content script received dashboard message:', event.detail);
    
    const { action } = event.detail;
    
    // Relay the message to the background script safely
    const response = await safeSendMessage({ action });
    console.log('🔍 Background script response:', response);
    
    // Send response back to dashboard
    const responseEvent = new CustomEvent('ghostscan-response', {
      detail: response
    });
    document.dispatchEvent(responseEvent);
  } catch (error) {
    console.log('🔍 Error handling dashboard communication:', error);
    
    // Send error response back to dashboard
    const errorEvent = new CustomEvent('ghostscan-response', {
      detail: { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }
    });
    document.dispatchEvent(errorEvent);
  }
}

// Initialize content script (optimized)
function initialize() {
  try {
    console.log('GhostScan analyzing page:', window.location.href);
    
    // Run initial detection once
    throttledDetection();
    
    // Set up optimized mutation observer for dynamic content
    const observer = new MutationObserver((mutations) => {
      // Clear existing timeout
      if (mutationTimeout) {
        clearTimeout(mutationTimeout);
      }
      
      // Debounce mutations to avoid excessive processing
      mutationTimeout = window.setTimeout(() => {
        // Only process if there are significant changes
        const significantChanges = mutations.filter(mutation => 
          mutation.type === 'childList' && 
          mutation.addedNodes.length > 0
        );
        
        if (significantChanges.length > 0) {
          throttledDetection();
        }
      }, 1000); // 1 second debounce
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Listen for messages from dashboard
    document.addEventListener('ghostscan-test-connection', handleDashboardCommunication as unknown as EventListener);
    document.addEventListener('ghostscan-start-scan', handleDashboardCommunication as unknown as EventListener);
    document.addEventListener('ghostscan-get-data', handleDashboardCommunication as unknown as EventListener);
  } catch (error) {
    console.log('Error initializing content script:', error);
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Listen for messages from popup
try {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'ANALYZE_PAGE') {
      console.log('Analyzing current page...');
      throttledDetection();
      sendResponse({ success: true });
    }
  });
} catch (error) {
  console.log('Error setting up message listener:', error);
} 