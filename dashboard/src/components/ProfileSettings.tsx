// Profile Settings Component for Cloudyx Dashboard
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CloudyxLogo } from './CloudyxLogo';

interface ProfileSettingsProps {
  onBack: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onBack }) => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('profile');
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: 'Security',
    lastName: 'Admin',
    email: user?.email || 'admin@company.com',
    role: 'Security Administrator',
    organization: 'TechFlow Startup',
    department: 'Information Security',
    phone: '+1 (555) 123-4567',
    timezone: 'America/New_York'
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: true,
    sessionTimeout: 60,
    passwordExpiry: 90,
    loginNotifications: true,
    securityAlerts: true
  });

  // Notification preferences
  const [notificationSettings, setNotificationSettings] = useState({
    breachAlerts: true,
    weeklyReports: true,
    monthlyReports: true,
    newAppAlerts: true,
    complianceUpdates: true,
    systemUpdates: false,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false
  });

  const handleProfileSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    alert('Profile updated successfully!');
  };

  const handleSecuritySave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    alert('Security settings updated successfully!');
  };

  const handleNotificationSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    alert('Notification preferences updated successfully!');
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await logout();
    }
  };

  const renderProfileSection = () => (
    <div className="settings-section">
      <div className="section-header">
        <h3>Profile Information</h3>
        <p>Manage your personal information and account details</p>
      </div>
      
      <div className="settings-grid">
        <div className="form-group">
          <label>First Name</label>
          <input
            type="text"
            value={profileData.firstName}
            onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Last Name</label>
          <input
            type="text"
            value={profileData.lastName}
            onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Role</label>
          <input
            type="text"
            value={profileData.role}
            disabled
            className="disabled-input"
          />
        </div>
        
        <div className="form-group">
          <label>Organization</label>
          <input
            type="text"
            value={profileData.organization}
            onChange={(e) => setProfileData({...profileData, organization: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Department</label>
          <input
            type="text"
            value={profileData.department}
            onChange={(e) => setProfileData({...profileData, department: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            value={profileData.phone}
            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Timezone</label>
          <select
            value={profileData.timezone}
            onChange={(e) => setProfileData({...profileData, timezone: e.target.value})}
          >
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      </div>
      
      <div className="section-actions">
        <button className="save-button" onClick={handleProfileSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="settings-section">
      <div className="section-header">
        <h3>Security Settings</h3>
        <p>Configure your account security and access controls</p>
      </div>
      
      <div className="security-controls">
        <div className="security-item">
          <div className="security-info">
            <h4>Two-Factor Authentication</h4>
            <p>Add an extra layer of security to your account</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={securitySettings.twoFactorEnabled}
              onChange={(e) => setSecuritySettings({...securitySettings, twoFactorEnabled: e.target.checked})}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        
        <div className="security-item">
          <div className="security-info">
            <h4>Session Timeout</h4>
            <p>Automatically sign out after period of inactivity</p>
          </div>
          <select
            value={securitySettings.sessionTimeout}
            onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
            className="security-select"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={480}>8 hours</option>
          </select>
        </div>
        
        <div className="security-item">
          <div className="security-info">
            <h4>Password Expiry</h4>
            <p>Require password changes after specified period</p>
          </div>
          <select
            value={securitySettings.passwordExpiry}
            onChange={(e) => setSecuritySettings({...securitySettings, passwordExpiry: parseInt(e.target.value)})}
            className="security-select"
          >
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
            <option value={365}>1 year</option>
          </select>
        </div>
        
        <div className="security-item">
          <div className="security-info">
            <h4>Login Notifications</h4>
            <p>Get notified when someone signs into your account</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={securitySettings.loginNotifications}
              onChange={(e) => setSecuritySettings({...securitySettings, loginNotifications: e.target.checked})}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        
        <div className="security-item">
          <div className="security-info">
            <h4>Security Alerts</h4>
            <p>Receive alerts about potential security threats</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={securitySettings.securityAlerts}
              onChange={(e) => setSecuritySettings({...securitySettings, securityAlerts: e.target.checked})}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <div className="section-actions">
        <button className="save-button" onClick={handleSecuritySave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Security Settings'}
        </button>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="settings-section">
      <div className="section-header">
        <h3>Notification Preferences</h3>
        <p>Choose how and when you want to receive notifications</p>
      </div>
      
      <div className="notification-categories">
        <div className="notification-category">
          <h4>Security Notifications</h4>
          <div className="notification-items">
            <div className="notification-item">
              <div className="notification-info">
                <span>Breach Alerts</span>
                <small>Critical security breaches affecting your apps</small>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notificationSettings.breachAlerts}
                  onChange={(e) => setNotificationSettings({...notificationSettings, breachAlerts: e.target.checked})}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="notification-item">
              <div className="notification-info">
                <span>New App Alerts</span>
                <small>When new applications are connected to your accounts</small>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notificationSettings.newAppAlerts}
                  onChange={(e) => setNotificationSettings({...notificationSettings, newAppAlerts: e.target.checked})}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="notification-item">
              <div className="notification-info">
                <span>Compliance Updates</span>
                <small>Changes in compliance status or regulations</small>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notificationSettings.complianceUpdates}
                  onChange={(e) => setNotificationSettings({...notificationSettings, complianceUpdates: e.target.checked})}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="notification-category">
          <h4>Reports</h4>
          <div className="notification-items">
            <div className="notification-item">
              <div className="notification-info">
                <span>Weekly Reports</span>
                <small>Security summary every Monday</small>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notificationSettings.weeklyReports}
                  onChange={(e) => setNotificationSettings({...notificationSettings, weeklyReports: e.target.checked})}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="notification-item">
              <div className="notification-info">
                <span>Monthly Reports</span>
                <small>Comprehensive monthly security report</small>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notificationSettings.monthlyReports}
                  onChange={(e) => setNotificationSettings({...notificationSettings, monthlyReports: e.target.checked})}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="notification-category">
          <h4>Delivery Methods</h4>
          <div className="notification-items">
            <div className="notification-item">
              <div className="notification-info">
                <span>Email Notifications</span>
                <small>Receive notifications via email</small>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notificationSettings.emailNotifications}
                  onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="notification-item">
              <div className="notification-info">
                <span>Push Notifications</span>
                <small>Browser push notifications</small>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notificationSettings.pushNotifications}
                  onChange={(e) => setNotificationSettings({...notificationSettings, pushNotifications: e.target.checked})}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="notification-item">
              <div className="notification-info">
                <span>SMS Notifications</span>
                <small>Critical alerts via text message</small>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notificationSettings.smsNotifications}
                  onChange={(e) => setNotificationSettings({...notificationSettings, smsNotifications: e.target.checked})}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="section-actions">
        <button className="save-button" onClick={handleNotificationSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Notification Preferences'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="profile-settings">
      <div className="settings-header">
        <div className="header-left">
          <button className="back-button" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Dashboard
          </button>
          <CloudyxLogo size="medium" showText={true} />
        </div>
        <div className="header-right">
          <button className="logout-button" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign Out
          </button>
        </div>
      </div>
      
      <div className="settings-container">
        <div className="settings-sidebar">
          <h2>Account Settings</h2>
          <nav className="settings-nav">
            <button
              className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveSection('profile')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Profile
            </button>
            
            <button
              className={`nav-item ${activeSection === 'security' ? 'active' : ''}`}
              onClick={() => setActiveSection('security')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              Security
            </button>
            
            <button
              className={`nav-item ${activeSection === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveSection('notifications')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Notifications
            </button>
          </nav>
        </div>
        
        <div className="settings-content">
          {activeSection === 'profile' && renderProfileSection()}
          {activeSection === 'security' && renderSecuritySection()}
          {activeSection === 'notifications' && renderNotificationsSection()}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;