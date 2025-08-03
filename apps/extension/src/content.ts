// GhostScan Browser Extension - Content Script

console.log('🔍 GhostScan Content Script loaded');

// Add a marker to indicate the content script is running
document.documentElement.setAttribute('data-ghostscan', 'loaded');

// Add a global property to indicate extension is available
(window as any).ghostScanExtension = {
  version: '1.0.1',
  available: true
};

// Performance optimization: Only run detections when scan is initiated
let isProcessing = false;
let lastDetectionTime = 0;
const DETECTION_COOLDOWN = 10000; // 10 seconds between detections
let detectionCount = 0;
const MAX_DETECTIONS_PER_PAGE = 3;
let scanMode = false; // Track if we're in scan mode

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

// Throttled detection function - only runs when scan is active
function throttledDetection() {
  if (!scanMode) {
    console.log('🔍 Detection skipped - not in scan mode');
    return;
  }
  
  if (isProcessing) return;
  
  const now = Date.now();
  if (now - lastDetectionTime < DETECTION_COOLDOWN) return;
  
  if (detectionCount >= MAX_DETECTIONS_PER_PAGE) {
    console.log('🔍 Max detections reached for this page');
    return;
  }
  
  isProcessing = true;
  lastDetectionTime = now;
  detectionCount++;
  
  try {
    // Only run one detection at a time to prevent freezing
    const detections = [
      () => detectOAuthElements(),
      () => detectTrackingScripts(),
      () => detectFormFields(),
      () => detectSaaSApplication()
    ];
    
    // Run detections with delays to prevent blocking
    detections.forEach((detection, index) => {
      setTimeout(() => {
        try {
          detection();
        } catch (error) {
          console.log('🔍 Detection error:', error);
        }
      }, index * 100); // 100ms delay between each detection
    });
  } finally {
    setTimeout(() => {
      isProcessing = false;
    }, 500); // 500ms cooldown
  }
}

// Detect OAuth buttons and forms (heavily optimized)
function detectOAuthElements() {
  try {
    // Very limited DOM queries to prevent freezing
    const oauthButtons = document.querySelectorAll('button, a');
    if (oauthButtons.length > 50) { // Reduced from 100
      console.log('🔍 Too many elements, skipping OAuth detection');
      return;
    }
    
    const oauthProviders = ['google', 'facebook', 'github', 'twitter', 'linkedin'];
    const detectedProviders = new Set<string>();
    
    // Only check first 20 elements to prevent freezing
    const limitedButtons = Array.from(oauthButtons).slice(0, 20);
    
    limitedButtons.forEach(button => {
      if (detectedProviders.size >= 3) return; // Reduced from 5
      
      const text = button.textContent?.toLowerCase() || '';
      const href = (button as HTMLAnchorElement).href?.toLowerCase() || '';
      
      oauthProviders.forEach(provider => {
        if (text.includes(provider) || href.includes(provider)) {
          if (!detectedProviders.has(provider)) {
            detectedProviders.add(provider);
            console.log(`🔍 Found OAuth provider: ${provider}`);
            // Send message to background script safely
            safeSendMessage({
              action: 'OAUTH_DETECTED',
              provider: provider,
              url: window.location.href
            }).catch(error => {
              console.log('🔍 Failed to send OAuth detection:', error);
            });
          }
        }
      });
    });
  } catch (error) {
    console.log('🔍 Error in detectOAuthElements:', error);
  }
}

// Detect tracking scripts (heavily optimized)
function detectTrackingScripts() {
  try {
    // Only check for common tracking scripts
    const trackingScripts = document.querySelectorAll('script[src]');
    if (trackingScripts.length > 30) { // Reduced limit
      console.log('🔍 Too many scripts, skipping tracking detection');
      return;
    }
    
    const trackingDomains = [
      'google-analytics',
      'facebook',
      'hotjar',
      'mixpanel',
      'amplitude',
      'segment'
    ];
    
    const detectedTrackers = new Set<string>();
    
    // Only check first 15 scripts
    const limitedScripts = Array.from(trackingScripts).slice(0, 15);
    
    limitedScripts.forEach(script => {
      if (detectedTrackers.size >= 5) return; // Reduced limit
      
      const src = (script as HTMLScriptElement).src.toLowerCase();
      
      trackingDomains.forEach(domain => {
        if (src.includes(domain) && !detectedTrackers.has(domain)) {
          detectedTrackers.add(domain);
          console.log(`🔍 Found tracking script: ${domain}`);
          
          safeSendMessage({
            action: 'TRACKING_DETECTED',
            tracker: domain,
            url: window.location.href
          }).catch(error => {
            console.log('🔍 Failed to send tracking detection:', error);
          });
        }
      });
    });
  } catch (error) {
    console.log('🔍 Error in detectTrackingScripts:', error);
  }
}

// Detect form fields (heavily optimized)
function detectFormFields() {
  try {
    const forms = document.querySelectorAll('form');
    if (forms.length > 10) { // Reduced limit
      console.log('🔍 Too many forms, skipping form detection');
      return;
    }
    
    const sensitiveFields = ['password', 'email', 'username', 'credit', 'ssn', 'phone'];
    let sensitiveFormFound = false;
    
    // Only check first 5 forms
    const limitedForms = Array.from(forms).slice(0, 5);
    
    limitedForms.forEach(form => {
      if (sensitiveFormFound) return;
      
      const inputs = form.querySelectorAll('input');
      if (inputs.length > 20) return; // Skip forms with too many inputs
      
      inputs.forEach(input => {
        const type = (input as HTMLInputElement).type.toLowerCase();
        const name = (input as HTMLInputElement).name.toLowerCase();
        const id = (input as HTMLInputElement).id.toLowerCase();
        
        sensitiveFields.forEach(field => {
          if (type.includes(field) || name.includes(field) || id.includes(field)) {
            sensitiveFormFound = true;
            console.log(`🔍 Found sensitive form field: ${field}`);
            
            safeSendMessage({
              action: 'FORM_DETECTED',
              fieldType: field,
              url: window.location.href
            }).catch(error => {
              console.log('🔍 Failed to send form detection:', error);
            });
          }
        });
      });
    });
  } catch (error) {
    console.log('🔍 Error in detectFormFields:', error);
  }
}

// Detect SaaS applications (heavily optimized)
function detectSaaSApplication() {
  try {
    const domain = window.location.hostname;
    const path = window.location.pathname;
    
    // Simple domain-based detection to avoid heavy processing
    const saasDomains = [
      'slack.com', 'notion.so', 'figma.com', 'zoom.us', 'teams.microsoft.com',
      'discord.com', 'trello.com', 'asana.com', 'monday.com', 'clickup.com'
    ];
    
    const isSaaS = saasDomains.some(saasDomain => domain.includes(saasDomain));
    
    if (isSaaS) {
      console.log(`🔍 SaaS application detected: ${domain}`);
      
      safeSendMessage({
        action: 'APP_DETECTED',
        app: domain,
        url: window.location.href,
        type: 'saas'
      }).catch(error => {
        console.log('🔍 Failed to send app detection:', error);
      });
    }
  } catch (error) {
    console.log('🔍 Error in detectSaaSApplication:', error);
  }
}

// Handle dashboard communication (optimized)
async function handleDashboardCommunication(event: CustomEvent) {
  try {
    console.log('🔍 Dashboard communication received:', event.detail);
    
    const response = await safeSendMessage({
      action: 'DASHBOARD_COMMUNICATION',
      data: event.detail
    });
    
    console.log('🔍 Dashboard communication response:', response);
    
    // Send response back to dashboard
    window.dispatchEvent(new CustomEvent('ghostscan-response', {
      detail: response
    }));
  } catch (error) {
    console.error('🔍 Error handling dashboard communication:', error);
  }
}

// Initialize content script - NO AUTOMATIC DETECTION
function initialize() {
  console.log('🔍 Initializing content script (scan mode disabled by default)...');
  
  // NO automatic detection on page load
  // Only run detections when explicitly requested
  
  // Listen for dashboard communication
  window.addEventListener('ghostscan-communication', handleDashboardCommunication as unknown as EventListener);
  
  // Listen for scan initiation messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'START_SCAN') {
      console.log('🔍 Scan initiated - enabling detection mode');
      scanMode = true;
      detectionCount = 0; // Reset detection count
      lastDetectionTime = 0; // Reset timer
      
      // Run initial detection
      setTimeout(() => {
        throttledDetection();
      }, 1000);
      
      sendResponse({ success: true });
    } else if (message.action === 'STOP_SCAN') {
      console.log('🔍 Scan stopped - disabling detection mode');
      scanMode = false;
      sendResponse({ success: true });
    } else if (message.action === 'ANALYZE_PAGE') {
      console.log('🔍 Analyze page request received');
      if (scanMode) {
        setTimeout(() => {
          throttledDetection();
        }, 1000);
      }
      sendResponse({ success: true });
    }
  });
  
  console.log('🔍 Content script initialized - waiting for scan commands');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
} 