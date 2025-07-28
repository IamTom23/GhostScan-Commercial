// GhostScan Browser Extension - Content Script

console.log('🔍 GhostScan Content Script loaded');

// Detect OAuth buttons and forms
function detectOAuthElements() {
  const oauthButtons = document.querySelectorAll('button, a, div');
  const oauthProviders = ['google', 'facebook', 'github', 'twitter', 'linkedin'];
  
  oauthButtons.forEach(button => {
    const text = button.textContent?.toLowerCase() || '';
    const href = (button as HTMLAnchorElement).href?.toLowerCase() || '';
    
    oauthProviders.forEach(provider => {
      if (text.includes(provider) || href.includes(provider)) {
        console.log(`Found OAuth provider: ${provider}`);
        // Send message to background script
        chrome.runtime.sendMessage({
          action: 'OAUTH_DETECTED',
          provider: provider,
          url: window.location.href
        });
      }
    });
  });
}

// Detect tracking scripts
function detectTrackingScripts() {
  const scripts = document.querySelectorAll('script[src]');
  const trackingPatterns = [
    'google-analytics',
    'googletagmanager',
    'facebook.net',
    'doubleclick',
    'hotjar',
    'mixpanel'
  ];
  
  scripts.forEach(script => {
    const src = (script as HTMLScriptElement).src.toLowerCase();
    trackingPatterns.forEach(pattern => {
      if (src.includes(pattern)) {
        console.log(`Found tracking script: ${pattern}`);
        chrome.runtime.sendMessage({
          action: 'TRACKING_DETECTED',
          tracker: pattern,
          url: window.location.href
        });
      }
    });
  });
}

// Detect form fields
function detectFormFields() {
  const forms = document.querySelectorAll('form');
  const sensitiveFields = ['email', 'password', 'phone', 'ssn', 'credit'];
  
  forms.forEach(form => {
    const inputs = form.querySelectorAll('input');
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
      chrome.runtime.sendMessage({
        action: 'SENSITIVE_FORM_DETECTED',
        fields: sensitiveData,
        url: window.location.href
      });
    }
  });
}

// Initialize content script
function initialize() {
  console.log('GhostScan analyzing page:', window.location.href);
  
  // Run initial detection
  detectOAuthElements();
  detectTrackingScripts();
  detectFormFields();
  
  // Set up mutation observer for dynamic content
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        detectOAuthElements();
        detectFormFields();
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'ANALYZE_PAGE') {
    console.log('Analyzing current page...');
    detectOAuthElements();
    detectTrackingScripts();
    detectFormFields();
    sendResponse({ success: true });
  }
}); 