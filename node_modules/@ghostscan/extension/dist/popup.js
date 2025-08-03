// GhostScan Browser Extension - Popup Script

class GhostScanPopup {
  constructor() {
    this.isScanning = false;
    this.scanProgress = 0;
    this.initializeElements();
    this.initializeEventListeners();
    this.loadInitialData();
  }

  initializeElements() {
    // Scan elements
    this.scanButton = document.getElementById('scanButton');
    this.scanProgress = document.getElementById('scanProgress');
    this.progressFill = document.getElementById('progressFill');
    this.progressText = document.getElementById('progressText');

    // Stats elements
    this.privacyScoreCircle = document.getElementById('privacyScoreCircle');
    this.privacyGrade = document.getElementById('privacyGrade');
    this.privacyScore = document.getElementById('privacyScore');
    this.totalApps = document.getElementById('totalApps');
    this.highRiskApps = document.getElementById('highRiskApps');
    this.trackingCookies = document.getElementById('trackingCookies');

    // Activity elements
    this.activityList = document.getElementById('activityList');
    this.refreshActivityBtn = document.getElementById('refreshActivityBtn');

    // Action elements
    this.clearCookiesBtn = document.getElementById('clearCookiesBtn');
    this.blockTrackersBtn = document.getElementById('blockTrackersBtn');
    this.privacyRequestsBtn = document.getElementById('privacyRequestsBtn');
    this.openDashboardBtn = document.getElementById('openDashboardBtn');

    // Tips elements
    this.tipsList = document.getElementById('tipsList');

    // Status elements
    this.statusIndicator = document.getElementById('statusIndicator');
    this.statusText = document.getElementById('statusText');

    // Notification container
    this.notificationContainer = document.getElementById('notificationContainer');
  }

  initializeEventListeners() {
    // Scan button
    if (this.scanButton) {
      this.scanButton.addEventListener('click', () => this.startScan());
    }

    // Action buttons
    if (this.clearCookiesBtn) {
      this.clearCookiesBtn.addEventListener('click', () => this.clearCookies());
    }
    if (this.blockTrackersBtn) {
      this.blockTrackersBtn.addEventListener('click', () => this.blockTrackers());
    }
    if (this.privacyRequestsBtn) {
      this.privacyRequestsBtn.addEventListener('click', () => this.generatePrivacyRequests());
    }
    if (this.openDashboardBtn) {
      this.openDashboardBtn.addEventListener('click', () => this.openDashboard());
    }

    // Refresh activity
    if (this.refreshActivityBtn) {
      this.refreshActivityBtn.addEventListener('click', () => this.refreshActivity());
    }

    // Footer links
    const settingsLink = document.getElementById('settingsLink');
    if (settingsLink) {
      settingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.openSettings();
      });
    }

    const helpLink = document.getElementById('helpLink');
    if (helpLink) {
      helpLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.openHelp();
      });
    }

    const aboutLink = document.getElementById('aboutLink');
    if (aboutLink) {
      aboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.openAbout();
      });
    }
  }

  async loadInitialData() {
    try {
      this.updateStatus('Loading...');
      
      // Load stored data
      const data = await chrome.storage.local.get([
        'privacyScore',
        'totalApps',
        'highRiskApps',
        'lastScan',
        'scanResult',
        'detectedApplications',
        'oauthDetections',
        'trackingDetections'
      ]);

      // Update privacy score
      this.updatePrivacyScore(data.privacyScore || 85);

      // Update stats
      this.updateStats({
        totalApps: data.totalApps || 12,
        highRiskApps: data.highRiskApps || 3,
        trackingCookies: data.trackingDetections?.length || 8
      });

      // Update activity
      this.updateActivity(data.scanResult, data.detectedApplications);

      // Update tips
      this.updateTips();

      this.updateStatus('Protected');

    } catch (error) {
      console.error('Error loading initial data:', error);
      this.updateStatus('Error loading data');
      this.showNotification('Error', 'Failed to load data');
    }
  }

  async startScan() {
    if (this.isScanning) return;

    this.isScanning = true;
    this.updateStatus('Scanning...');
    this.showScanProgress();

    try {
      // Send scan request to background script
      const response = await chrome.runtime.sendMessage({ action: 'START_SCAN' });

      if (response && response.success) {
        const scanResult = response.data;
        
        // Update UI with scan results
        this.updatePrivacyScore(100 - scanResult.totalRiskScore);
        this.updateStats({
          totalApps: scanResult.apps.length,
          highRiskApps: scanResult.apps.filter(app => 
            app.riskLevel === 'HIGH' || app.riskLevel === 'CRITICAL'
          ).length,
          trackingCookies: scanResult.trackingData?.length || 0
        });

        this.updateActivity(scanResult);
        this.updateStatus('Scan completed');
        
        // Show success message
        this.showNotification('Scan completed!', `Found ${scanResult.apps.length} apps`);

      } else {
        throw new Error(response?.error || 'Scan failed');
      }

    } catch (error) {
      console.error('Scan error:', error);
      this.updateStatus('Scan failed');
      this.showNotification('Scan failed', error.message);
    } finally {
      this.isScanning = false;
      this.hideScanProgress();
    }
  }

  showScanProgress() {
    if (this.scanProgress) {
      this.scanProgress.classList.remove('hidden');
    }
    if (this.scanButton) {
      this.scanButton.disabled = true;
      const buttonText = this.scanButton.querySelector('.button-text');
      if (buttonText) {
        buttonText.textContent = 'Scanning...';
      }
    }
    
    // Start progress animation
    this.animateProgress();
  }

  hideScanProgress() {
    if (this.scanProgress) {
      this.scanProgress.classList.add('hidden');
    }
    if (this.scanButton) {
      this.scanButton.disabled = false;
      const buttonText = this.scanButton.querySelector('.button-text');
      if (buttonText) {
        buttonText.textContent = 'Start Scan';
      }
    }
    if (this.progressFill) {
      this.progressFill.style.width = '0%';
    }
  }

  animateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      
      if (this.progressFill) {
        this.progressFill.style.width = progress + '%';
      }
      if (this.progressText) {
        this.progressText.textContent = `Analyzing your privacy... ${Math.round(progress)}%`;
      }
    }, 200);
  }

  updatePrivacyScore(score) {
    if (!this.privacyScore || !this.privacyGrade) return;
    
    const grade = this.getPrivacyGrade(score);
    const color = this.getGradeColor(grade);

    this.privacyScore.textContent = score;
    this.privacyGrade.textContent = grade;
    
    // Update the progress ring instead of border color
    if (this.privacyScoreCircle) {
      const progressRing = this.privacyScoreCircle.querySelector('.score-ring-progress');
      if (progressRing) {
        const circumference = 2 * Math.PI * 26; // r=26
        const offset = circumference - (score / 100) * circumference;
        progressRing.style.strokeDashoffset = offset;
        progressRing.style.stroke = color;
      }
    }
  }

  getPrivacyGrade(score) {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    return 'D';
  }

  getGradeColor(grade) {
    const colors = {
      'A': '#22c55e', // success-500
      'B': '#f59e0b', // warning-500
      'C': '#ef4444', // danger-500
      'D': '#7c2d12'  // critical
    };
    return colors[grade] || '#6b7280';
  }

  updateStats(stats) {
    if (this.totalApps) this.totalApps.textContent = stats.totalApps;
    if (this.highRiskApps) this.highRiskApps.textContent = stats.highRiskApps;
    if (this.trackingCookies) this.trackingCookies.textContent = stats.trackingCookies;
  }

  updateActivity(scanResult, detectedApplications = []) {
    const activities = [];

    if (scanResult && scanResult.apps) {
      // Add scan completion activity
      activities.push({
        icon: 'scan',
        title: 'Privacy scan completed',
        time: '2 minutes ago'
      });

      // Add high-risk apps activity
      const highRiskApps = scanResult.apps.filter(app => 
        app.riskLevel === 'HIGH' || app.riskLevel === 'CRITICAL'
      );
      if (highRiskApps.length > 0) {
        activities.push({
          icon: 'warning',
          title: 'High-risk app detected',
          time: '5 minutes ago'
        });
      }

      // Add OAuth connections activity
      const oauthApps = scanResult.apps.filter(app => app.oauthProvider);
      if (oauthApps.length > 0) {
        activities.push({
          icon: 'link',
          title: 'OAuth connections found',
          time: '10 minutes ago'
        });
      }
    }

    // Add recent detections
    if (detectedApplications && detectedApplications.length > 0) {
      const recentDetections = detectedApplications.slice(-3);
      recentDetections.forEach(app => {
        activities.push({
          icon: 'detect',
          title: 'New app detected',
          time: '15 minutes ago'
        });
      });
    }

    this.renderActivities(activities);
  }

  renderActivities(activities) {
    if (!this.activityList) return;
    
    if (activities.length === 0) {
      this.showDefaultActivity();
      return;
    }

    // Limit to 5 most recent activities
    const recentActivities = activities.slice(-5);

    this.activityList.innerHTML = recentActivities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon ${activity.icon === 'warning' ? 'warning' : ''}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
          </svg>
        </div>
        <div class="activity-content">
          <div class="activity-title">${activity.title}</div>
          <div class="activity-time">${activity.time}</div>
        </div>
      </div>
    `).join('');
  }

  showDefaultActivity() {
    if (!this.activityList) return;
    
    this.activityList.innerHTML = `
      <div class="activity-item">
        <div class="activity-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
          </svg>
        </div>
        <div class="activity-content">
          <div class="activity-title">No recent activity</div>
          <div class="activity-time">Run a scan to see your privacy status</div>
        </div>
      </div>
    `;
  }

  updateTips() {
    if (!this.tipsList) return;
    
    const tips = [
      {
        title: 'Enable Two-Factor Authentication',
        description: 'Add an extra layer of security to your accounts'
      },
      {
        title: 'Use Strong, Unique Passwords',
        description: 'Consider using a password manager for better security'
      }
    ];

    this.tipsList.innerHTML = tips.map(tip => `
      <div class="tip-item">
        <div class="tip-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
          </svg>
        </div>
        <div class="tip-content">
          <div class="tip-title">${tip.title}</div>
          <div class="tip-description">${tip.description}</div>
        </div>
      </div>
    `).join('');
  }

  async clearCookies() {
    try {
      this.updateStatus('Clearing cookies...');
      
      // Get all cookies
      const cookies = await chrome.cookies.getAll({});
      
      // Clear tracking cookies
      const trackingCookies = cookies.filter(cookie => 
        cookie.name.includes('_ga') || 
        cookie.name.includes('_fbp') || 
        cookie.name.includes('_gid') ||
        cookie.domain.includes('google-analytics') ||
        cookie.domain.includes('facebook') ||
        cookie.domain.includes('doubleclick')
      );

      // Remove tracking cookies
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

      this.updateStatus('Protected');
      this.showNotification('Cookies cleared', `Removed ${removedCount} tracking cookies`);
      
      // Update tracking cookies count
      if (this.trackingCookies) {
        this.trackingCookies.textContent = '0';
      }

    } catch (error) {
      console.error('Error clearing cookies:', error);
      this.updateStatus('Failed to clear cookies');
      this.showNotification('Error', 'Failed to clear cookies');
    }
  }

  async blockTrackers() {
    try {
      this.updateStatus('Blocking trackers...');
      
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Inject content script to block trackers
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          // Block common tracking scripts
          const trackingScripts = document.querySelectorAll('script[src*="google-analytics"], script[src*="facebook"], script[src*="hotjar"], script[src*="mixpanel"]');
          trackingScripts.forEach(script => {
            script.remove();
          });
          
          // Block tracking pixels
          const trackingPixels = document.querySelectorAll('img[src*="pixel"], img[src*="tracking"]');
          trackingPixels.forEach(pixel => {
            pixel.style.display = 'none';
          });
        }
      });

      this.updateStatus('Protected');
      this.showNotification('Trackers blocked', 'Blocked tracking scripts on this page');

    } catch (error) {
      console.error('Error blocking trackers:', error);
      this.updateStatus('Failed to block trackers');
      this.showNotification('Error', 'Failed to block trackers');
    }
  }

  async generatePrivacyRequests() {
    try {
      this.updateStatus('Generating requests...');
      
      // Get stored data
      const data = await chrome.storage.local.get(['detectedApplications', 'scanResult']);
      const apps = data.detectedApplications || data.scanResult?.apps || [];
      
      const appsWithThirdPartySharing = apps.filter(app => app.thirdPartySharing || app.dataTypes?.includes('tracking'));
      
      if (appsWithThirdPartySharing.length === 0) {
        this.showNotification('No apps found', 'No apps with third-party sharing detected');
        return;
      }

      // Generate privacy request templates
      const requests = appsWithThirdPartySharing.slice(0, 5).map(app => ({
        app: app.name,
        domain: app.domain,
        template: `Subject: Data Deletion Request - ${app.name}

Dear ${app.name} Privacy Team,

I am writing to request the deletion of all personal data you have collected about me under the right to be forgotten (GDPR Article 17).

Please delete all personal information associated with my account, including but not limited to:
- Profile information
- Usage data
- Analytics data
- Any third-party data sharing

Please confirm receipt of this request and provide a timeline for completion.

Thank you,
[Your Name]`
      }));

      // Create a new tab with the requests
      const requestsText = requests.map(req => 
        `📧 ${req.app} (${req.domain})\n\n${req.template}\n\n---\n`
      ).join('\n');

      const blob = new Blob([requestsText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      chrome.tabs.create({ url });

      this.updateStatus('Protected');
      this.showNotification('Privacy requests generated', `Created ${requests.length} request templates`);

    } catch (error) {
      console.error('Error generating privacy requests:', error);
      this.updateStatus('Failed to generate requests');
      this.showNotification('Error', 'Failed to generate privacy requests');
    }
  }

  openDashboard() {
    // Open the main dashboard in a new tab
    chrome.tabs.create({
      url: 'https://ghost-scan-commercial-oq2p8vaq-toms-projects-0165a016.vercel.app/'
    });
  }

  async refreshActivity() {
    try {
      this.updateStatus('Refreshing...');
      await this.loadInitialData();
      this.updateStatus('Protected');
      this.showNotification('Refreshed', 'Activity data updated');
    } catch (error) {
      console.error('Error refreshing activity:', error);
      this.updateStatus('Refresh failed');
      this.showNotification('Error', 'Failed to refresh activity');
    }
  }

  openSettings() {
    // Show settings notification instead of opening options page
    this.showNotification('Settings', 'Settings panel coming soon!');
  }

  openHelp() {
    // Open help documentation
    chrome.tabs.create({
      url: 'https://ghostscan.com/help'
    });
  }

  openAbout() {
    // Show about information
    this.showNotification('About GhostScan', 'Version 1.0.1\nPrivacy protection powered by AI\nMade with ❤️ by Virtrus');
  }

  updateStatus(status) {
    if (!this.statusText) return;
    
    this.statusText.textContent = status;
    
    // Update status indicator color
    if (this.statusIndicator) {
      if (status === 'Protected' || status === 'Scan completed' || status === 'Refreshed') {
        this.statusIndicator.style.backgroundColor = '#22c55e'; // Green
      } else if (status === 'Scanning...' || status === 'Clearing cookies...' || status === 'Blocking trackers...' || status === 'Generating requests...' || status === 'Refreshing...') {
        this.statusIndicator.style.backgroundColor = '#f59e0b'; // Yellow
      } else {
        this.statusIndicator.style.backgroundColor = '#ef4444'; // Red
      }
    }
  }

  showNotification(title, message) {
    if (!this.notificationContainer) return;
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    `;

    this.notificationContainer.appendChild(notification);

    // Remove notification after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 4000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new GhostScanPopup();
}); 