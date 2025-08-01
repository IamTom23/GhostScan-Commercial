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

    // Action elements
    this.clearCookiesBtn = document.getElementById('clearCookiesBtn');
    this.openDashboardBtn = document.getElementById('openDashboardBtn');

    // Status elements
    this.statusIndicator = document.getElementById('statusIndicator');
    this.statusText = document.getElementById('statusText');
  }

  initializeEventListeners() {
    // Scan button
    this.scanButton.addEventListener('click', () => this.startScan());

    // Action buttons
    this.clearCookiesBtn.addEventListener('click', () => this.clearCookies());
    this.openDashboardBtn.addEventListener('click', () => this.openDashboard());

    // Footer links
    document.getElementById('settingsLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.openSettings();
    });

    document.getElementById('helpLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.openHelp();
    });
  }

  async loadInitialData() {
    try {
      // Load stored data
      const data = await chrome.storage.local.get([
        'privacyScore',
        'totalApps',
        'highRiskApps',
        'lastScan',
        'scanResult'
      ]);

      // Update privacy score
      this.updatePrivacyScore(data.privacyScore || 0);

      // Update stats
      this.updateStats({
        totalApps: data.totalApps || 0,
        highRiskApps: data.highRiskApps || 0,
        trackingCookies: 0 // Will be updated from cookie analysis
      });

      // Update activity
      this.updateActivity(data.scanResult);

      // Update status
      this.updateStatus('Ready');

    } catch (error) {
      console.error('Error loading initial data:', error);
      this.updateStatus('Error loading data');
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

      if (response.success) {
        const scanResult = response.data;
        
        // Update UI with scan results
        this.updatePrivacyScore(100 - scanResult.totalRiskScore);
        this.updateStats({
          totalApps: scanResult.apps.length,
          highRiskApps: scanResult.apps.filter(app => 
            app.riskLevel === 'HIGH' || app.riskLevel === 'CRITICAL'
          ).length,
          trackingCookies: 0 // Will be updated separately
        });

        this.updateActivity(scanResult);
        this.updateStatus('Scan completed');
        
        // Show success message
        this.showNotification('Scan completed!', 'Found ' + scanResult.apps.length + ' apps');

      } else {
        throw new Error(response.error || 'Scan failed');
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
    this.scanProgress.classList.remove('hidden');
    this.scanButton.disabled = true;
    this.scanButton.querySelector('.scan-text').textContent = 'Scanning...';
    
    // Start progress animation
    this.animateProgress();
  }

  hideScanProgress() {
    this.scanProgress.classList.add('hidden');
    this.scanButton.disabled = false;
    this.scanButton.querySelector('.scan-text').textContent = 'Start Scan';
    this.progressFill.style.width = '0%';
  }

  animateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      
      this.progressFill.style.width = progress + '%';
      this.progressText.textContent = `Scanning... ${Math.round(progress)}%`;
    }, 200);
  }

  updatePrivacyScore(score) {
    const grade = this.getPrivacyGrade(score);
    const color = this.getGradeColor(grade);

    this.privacyScore.textContent = score;
    this.privacyGrade.textContent = grade;
    this.privacyScoreCircle.style.borderColor = color;
  }

  getPrivacyGrade(score) {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    return 'D';
  }

  getGradeColor(grade) {
    const colors = {
      'A': '#10B981',
      'B': '#F59E0B',
      'C': '#EF4444',
      'D': '#7C2D12'
    };
    return colors[grade] || '#6B7280';
  }

  updateStats(stats) {
    this.totalApps.textContent = stats.totalApps;
    this.highRiskApps.textContent = stats.highRiskApps;
    this.trackingCookies.textContent = stats.trackingCookies;
  }

  updateActivity(scanResult) {
    if (!scanResult || !scanResult.apps) {
      this.showDefaultActivity();
      return;
    }

    const activities = [];

    // Add scan completion activity
    activities.push({
      icon: '✅',
      title: 'Scan Completed',
      description: `Found ${scanResult.apps.length} apps`
    });

    // Add high-risk apps activity
    const highRiskApps = scanResult.apps.filter(app => 
      app.riskLevel === 'HIGH' || app.riskLevel === 'CRITICAL'
    );
    if (highRiskApps.length > 0) {
      activities.push({
        icon: '⚠️',
        title: 'High Risk Apps Found',
        description: `${highRiskApps.length} apps need attention`
      });
    }

    // Add OAuth connections activity
    const oauthApps = scanResult.apps.filter(app => app.oauthProvider);
    if (oauthApps.length > 0) {
      activities.push({
        icon: '🔗',
        title: 'OAuth Connections',
        description: `${oauthApps.length} connected accounts`
      });
    }

    this.renderActivities(activities);
  }

  showDefaultActivity() {
    this.activityList.innerHTML = `
      <div class="activity-item">
        <span class="activity-icon">📊</span>
        <div class="activity-content">
          <div class="activity-title">No recent activity</div>
          <div class="activity-description">Run a scan to see your privacy status</div>
        </div>
      </div>
    `;
  }

  renderActivities(activities) {
    if (activities.length === 0) {
      this.showDefaultActivity();
      return;
    }

    this.activityList.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <span class="activity-icon">${activity.icon}</span>
        <div class="activity-content">
          <div class="activity-title">${activity.title}</div>
          <div class="activity-description">${activity.description}</div>
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
        cookie.domain.includes('facebook')
      );

      // Remove tracking cookies
      for (const cookie of trackingCookies) {
        await chrome.cookies.remove({
          url: `https://${cookie.domain}${cookie.path}`,
          name: cookie.name
        });
      }

      this.updateStatus('Cookies cleared');
      this.showNotification('Cookies cleared', `Removed ${trackingCookies.length} tracking cookies`);
      
      // Update tracking cookies count
      this.trackingCookies.textContent = '0';

    } catch (error) {
      console.error('Error clearing cookies:', error);
      this.updateStatus('Failed to clear cookies');
      this.showNotification('Error', 'Failed to clear cookies');
    }
  }

  openDashboard() {
    // Open the main dashboard in a new tab
    chrome.tabs.create({
      url: 'http://localhost:5174' // Dashboard URL
    });
  }

  openSettings() {
    // Open extension settings
    chrome.runtime.openOptionsPage();
  }

  openHelp() {
    // Open help documentation
    chrome.tabs.create({
      url: 'https://ghostscan.com/help'
    });
  }

  updateStatus(status) {
    this.statusText.textContent = status;
    
    // Update status indicator color
    if (status === 'Ready' || status === 'Scan completed') {
      this.statusIndicator.style.backgroundColor = '#10B981'; // Green
    } else if (status === 'Scanning...' || status === 'Clearing cookies...') {
      this.statusIndicator.style.backgroundColor = '#F59E0B'; // Yellow
    } else {
      this.statusIndicator.style.backgroundColor = '#EF4444'; // Red
    }
  }

  showNotification(title, message) {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
      </div>
    `;

    // Add notification styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      padding: 1rem;
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      max-width: 300px;
      animation: slideIn 0.3s ease;
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new GhostScanPopup();
}); 