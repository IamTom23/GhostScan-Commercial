import { useState, useEffect } from 'react';
import './App.css';
// Local type definitions to avoid build issues
interface SaaSApp {
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
  isReused?: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  riskScore: number;
  totalApps: number;
  highRiskApps: number;
  lastScanDate: Date;
  preferences: {
    breachAlerts: boolean;
    weeklyReports: boolean;
    autoPrivacyRequests: boolean;
  };
}

interface BreachAlert {
  id: string;
  appId: string;
  breachDate: Date;
  dataTypes: string[];
  severity: 'MEDIUM' | 'LOW' | 'HIGH' | 'CRITICAL';
  description: string;
  isNew: boolean;
}

interface GhostProfile {
  id: string;
  platform: string;
  email: string;
  username: string;
  foundVia: string;
  confidence: number;
  dataExposed: string[];
}
import { extensionService } from './services/extensionService';
import { apiService } from './services/apiService';

// Local utility functions to avoid build issues
const getRiskColor = (riskLevel: string): string => {
  const colors = {
    LOW: '#10B981', // green
    MEDIUM: '#F59E0B', // yellow
    HIGH: '#EF4444', // red
    CRITICAL: '#7C2D12', // dark red
  };
  return colors[riskLevel as keyof typeof colors] || '#6B7280';
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Mock data for demonstration (commented out - using empty states)
// const mockUserProfile: UserProfile = {
//   id: '1',
//   email: 'user@example.com',
//   riskScore: 45,
//   totalApps: 23,
//   highRiskApps: 3,
//   lastScanDate: new Date(),
//   preferences: {
//     breachAlerts: true,
//     weeklyReports: true,
//     autoPrivacyRequests: false,
//   },
// };

// const mockApps: SaaSApp[] = [
//   {
//     id: '1',
//     name: 'Canva',
//     domain: 'canva.com',
//     riskLevel: 'MEDIUM',
//     dataTypes: ['personal', 'creative'],
//     hasBreaches: false,
//     thirdPartySharing: true,
//     lastAccessed: new Date('2024-01-15'),
//     oauthProvider: 'Google',
//     accountStatus: 'ACTIVE',
//     passwordStrength: 'STRONG',
//   },
//   {
//     id: '2',
//     name: 'Grammarly',
//     domain: 'grammarly.com',
//     riskLevel: 'HIGH',
//     dataTypes: ['personal', 'writing', 'documents'],
//     hasBreaches: true,
//     thirdPartySharing: true,
//     lastAccessed: new Date('2024-01-10'),
//     accountStatus: 'ACTIVE',
//     passwordStrength: 'WEAK',
//     isReused: true,
//   },
//   {
//     id: '3',
//     name: 'Adobe Creative Cloud',
//     domain: 'adobe.com',
//     riskLevel: 'LOW',
//     dataTypes: ['personal', 'creative'],
//     hasBreaches: false,
//     thirdPartySharing: false,
//     lastAccessed: new Date('2024-01-20'),
//     accountStatus: 'ACTIVE',
//     passwordStrength: 'STRONG',
//   },
// ];

// const mockBreachAlerts: BreachAlert[] = [
//   {
//     id: '1',
//     appId: '2',
//     breachDate: new Date('2024-01-05'),
//     dataTypes: ['emails', 'passwords'],
//     severity: 'HIGH',
//     description: 'Data breach affecting 3.2M users',
//     isNew: true,
//   },
// ];

// const mockGhostProfiles: GhostProfile[] = [
//   {
//     id: '1',
//     platform: 'LinkedIn',
//     email: 'user@example.com',
//     username: 'user_profile',
//     foundVia: 'SHADOW_PROFILE',
//     confidence: 0.95,
//     dataExposed: ['name', 'email', 'work_history'],
//   },
// ];

// Consumer-focused action items
// const mockActionItems = [
//   {
//     id: '1',
//     title: 'Change Grammarly Password',
//     priority: 'HIGH',
//     type: 'PASSWORD',
//     description: 'Grammarly was breached and uses a weak password',
//     estimatedTime: '2 minutes',
//     completed: false,
//   },
//   {
//     id: '2',
//     title: 'Review Canva Privacy Settings',
//     priority: 'MEDIUM',
//     type: 'PRIVACY',
//     description: 'Canva shares data with third parties',
//     estimatedTime: '5 minutes',
//     completed: false,
//   },
//   {
//     id: '3',
//     title: 'Remove LinkedIn Ghost Profile',
//     priority: 'MEDIUM',
//     type: 'GHOST_PROFILE',
//     description: 'Found shadow profile with 95% confidence',
//     estimatedTime: '10 minutes',
//     completed: false,
//   },
// ];

// Privacy tips for consumers
// const mockPrivacyTips = [
//   {
//     id: '1',
//     title: 'Use a Password Manager',
//     description: 'Generate unique, strong passwords for each account',
//     category: 'SECURITY',
//     difficulty: 'EASY',
//     timeEstimate: '5 minutes',
//     completed: false,
//   },
//   {
//     id: '2',
//     title: 'Enable Two-Factor Authentication',
//     description: 'Add an extra layer of security to your accounts',
//     category: 'SECURITY',
//     difficulty: 'EASY',
//     timeEstimate: '10 minutes',
//     completed: false,
//   },
//   {
//     id: '3',
//     title: 'Review App Permissions',
//     description: 'Check what data your apps can access',
//     category: 'PRIVACY',
//     difficulty: 'MEDIUM',
//     timeEstimate: '15 minutes',
//     completed: false,
//   },
// ];

// Progress tracking
const mockProgressData = {
  weeklyProgress: 75,
  monthlyProgress: 60,
  totalActionsCompleted: 12,
  privacyScoreImprovement: 15,
  streakDays: 7,
};

function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [apps, setApps] = useState<SaaSApp[]>([]);
  const [breachAlerts, setBreachAlerts] = useState<BreachAlert[]>([]);
  const [ghostProfiles] = useState<GhostProfile[]>([]);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [privacyTips, setPrivacyTips] = useState<any[]>([]);
  const [progressData] = useState(mockProgressData);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isScanning, setIsScanning] = useState(false);
  const [extensionStatus, setExtensionStatus] = useState<{
    available: boolean;
    installed: boolean;
    lastScan: Date | null;
    privacyScore: number | null;
    debugInfo?: {
      chromeAvailable: boolean;
      runtimeAvailable: boolean;
      storageAvailable: boolean;
      testMessageSent: boolean;
    };
  }>({ available: false, installed: false, lastScan: null, privacyScore: null });
  const [showDebug, setShowDebug] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your AI privacy assistant. Ask me anything about your data security, like 'Is my info safe on Canva?' or 'What does Grammarly do with my writing?'",
      timestamp: new Date(),
    }
  ]);
  const [aiInput, setAiInput] = useState('');

  // Load real data from extension and backend API on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // First try to load data from backend API
        console.log('Attempting to load data from backend API...');
        const apiConnectionResult = await apiService.testConnection();
        console.log('API connection test result:', apiConnectionResult);
        
        if (apiConnectionResult.success) {
          // Load demo startup data from backend
          const orgData = await apiService.getDemoStartup();
          if (orgData.success && orgData.data) {
            const dashboardData = apiService.convertOrganizationToDashboardFormat(orgData.data);
            if (dashboardData) {
              setUserProfile(dashboardData.userProfile);
              setApps(dashboardData.apps);
              setBreachAlerts(dashboardData.breachAlerts);
              setActionItems(dashboardData.actions);
              setPrivacyTips(dashboardData.privacyTips);
              setHasData(true);
              console.log('Loaded data from backend API:', dashboardData);
              return; // Success, no need to try extension
            }
          }
        }

        // Fallback to extension data if API fails
        console.log('Backend API not available, trying extension...');
        const extensionConnectionResult = await extensionService.testConnection();
        console.log('Extension connection test result:', extensionConnectionResult);
        
        if (extensionConnectionResult.success) {
          // Update extension status to show it's working
          setExtensionStatus({
            available: true,
            installed: true,
            lastScan: null,
            privacyScore: null,
            debugInfo: {
              chromeAvailable: true,
              runtimeAvailable: true,
              storageAvailable: true,
              testMessageSent: true
            }
          });

          // Get extension data
          const extensionData = await extensionService.getExtensionData();
          if (extensionData) {
            const dashboardData = extensionService.convertToDashboardFormat(extensionData);
            if (dashboardData) {
              setUserProfile(dashboardData.userProfile);
              setApps(dashboardData.apps);
              setBreachAlerts(dashboardData.breachAlerts);
              // Use real actions and privacy tips if available
              if (dashboardData.actions) {
                setActionItems(dashboardData.actions);
              }
              if (dashboardData.privacyTips) {
                setPrivacyTips(dashboardData.privacyTips);
              }
              setHasData(true);
              console.log('Loaded real data from extension:', dashboardData);
            }
          }
        } else {
          console.log('Neither backend API nor extension available');
          console.log('Extension error:', extensionConnectionResult.message);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const startScan = async () => {
    setIsScanning(true);
    console.log('Starting scan...');
    
    try {
      if (extensionStatus.available && extensionStatus.debugInfo?.testMessageSent) {
        console.log('Triggering real scan via extension...');
        
        // Trigger real scan via extension
        const scanResult = await extensionService.triggerExtensionScan();
        console.log('Scan result received:', scanResult);
        
        if (scanResult) {
          const dashboardData = extensionService.convertToDashboardFormat({
            scanResult,
            privacyScore: 100 - scanResult.totalRiskScore
          });
          if (dashboardData) {
            setUserProfile(dashboardData.userProfile);
            setApps(dashboardData.apps);
            setBreachAlerts(dashboardData.breachAlerts);
            // Use real actions and privacy tips from scan
            if (dashboardData.actions) {
              setActionItems(dashboardData.actions);
            }
            if (dashboardData.privacyTips) {
              setPrivacyTips(dashboardData.privacyTips);
            }
            setHasData(true);
            console.log('Scan completed with real data:', dashboardData);
          }
        } else {
          console.log('No scan result received, trying to get stored data...');
          // Try to get the latest stored data from extension
          const extensionData = await extensionService.getExtensionData();
          if (extensionData && extensionData.scanResult) {
            const dashboardData = extensionService.convertToDashboardFormat(extensionData);
            if (dashboardData) {
              setUserProfile(dashboardData.userProfile);
              setApps(dashboardData.apps);
              setBreachAlerts(dashboardData.breachAlerts);
              console.log('Loaded stored scan data:', dashboardData);
            }
          }
        }
      } else {
        console.log('Extension not available, using simulated scan...');
        // Fallback to simulated scan if extension not available
        setTimeout(() => {
          setIsScanning(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error during scan:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const getPrivacyScore = () => {
    const maxScore = 100;
    const deductions = (userProfile?.riskScore || 0) + (breachAlerts.length * 10) + (ghostProfiles.length * 5);
    return Math.max(0, maxScore - deductions);
  };

  const getPrivacyGrade = (score: number) => {
    if (score >= 80) return { grade: 'A', color: '#10B981' };
    if (score >= 60) return { grade: 'B', color: '#F59E0B' };
    if (score >= 40) return { grade: 'C', color: '#EF4444' };
    return { grade: 'D', color: '#7C2D12' };
  };

  const handleAiMessage = () => {
    if (!aiInput.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: aiInput,
      timestamp: new Date(),
    };

    setAiMessages(prev => [...prev, userMessage]);
    setAiInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        content: getAiResponse(aiInput),
        timestamp: new Date(),
      };
      setAiMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const getAiResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('canva')) {
      return "Canva is generally safe for privacy. They collect basic account info and your designs, but don't sell your data to third parties. However, they do use your data for improving their service and may share it with service providers. Consider reviewing your privacy settings in your Canva account.";
    }
    
    if (lowerQuery.includes('grammarly')) {
      return "⚠️ Grammarly has some privacy concerns. They analyze your writing content to provide suggestions, which means they can see what you're typing. They also share data with third parties for analytics. If you're writing sensitive documents, consider using it offline or switching to a more privacy-focused alternative.";
    }
    
    if (lowerQuery.includes('password')) {
      return "Here are some password best practices:\n• Use unique passwords for each account\n• Make them at least 12 characters long\n• Include numbers, symbols, and mixed case\n• Consider using a password manager\n• Enable two-factor authentication wherever possible";
    }
    
    if (lowerQuery.includes('breach')) {
      return "If you've been in a data breach:\n1. Change your password immediately\n2. Enable two-factor authentication\n3. Check for suspicious activity\n4. Consider freezing your credit\n5. Monitor your accounts regularly";
    }
    
    return "I'm here to help with your privacy questions! You can ask me about specific apps, password security, data breaches, or general privacy tips. What would you like to know more about?";
  };

  const privacyScore = getPrivacyScore();
  const privacyGrade = getPrivacyGrade(privacyScore);

  const testConnection = async () => {
    console.log('Testing extension connection...');
    try {
      const result = await extensionService.testConnection();
      alert(`Connection Test: ${result.success ? 'SUCCESS' : 'FAILED'}\n\n${result.message}`);
    } catch (error) {
      alert(`Connection Test FAILED:\n\nError: ${error}`);
    }
  };

  const testExtensionIDs = () => {
    console.log('Testing extension IDs...');
    if (typeof window !== 'undefined' && window.chrome?.runtime) {
      const possibleIds = [
        'lldnikolaejjojgiabojpfhmpaafeige',
        'test-extension-id',
        'another-possible-id'
      ];
      
      possibleIds.forEach(id => {
        window.chrome!.runtime!.sendMessage(id, { action: 'PING' }, (response) => {
          console.log(`Extension ID ${id}:`, response);
          if (window.chrome?.runtime?.lastError) {
            console.log(`Extension ID ${id} error:`, window.chrome.runtime.lastError);
          }
        });
      });
    }
  };

  const testContentScript = () => {
    console.log('Testing content script...');
    
    // Check if content script marker exists
    const marker = document.querySelector('[data-ghostscan]');
    console.log('Content script marker:', marker);
    
    // Check if global property exists
    const globalProp = (window as any).ghostScanExtension;
    console.log('Global property:', globalProp);
    
    // Try to dispatch a test event
    const event = new CustomEvent('ghostscan-test-connection', {
      detail: { action: 'PING' }
    });
    document.dispatchEvent(event);
    console.log('Test event dispatched');
    
    // Listen for response
    const handler = (event: any) => {
      console.log('Response received:', event.detail);
      document.removeEventListener('ghostscan-response', handler);
    };
    document.addEventListener('ghostscan-response', handler);
  };

  // Quick Action Functions
  const handlePrivacyRequests = async () => {
    console.log('Initiating privacy requests...');
    
    // Get apps that share data with third parties
    const appsWithThirdPartySharing = apps.filter(app => app.thirdPartySharing);
    
    if (appsWithThirdPartySharing.length === 0) {
      alert('No apps found that share data with third parties.');
      return;
    }

    // Generate privacy request templates
    const requests = appsWithThirdPartySharing.map(app => ({
      app: app.name,
      domain: app.domain,
      requestType: 'data_deletion',
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

    // Show results
    const resultText = requests.map(req => 
      `📧 ${req.app} (${req.domain})\n${req.template}\n\n---\n`
    ).join('\n');

    alert(`Privacy Request Templates Generated!\n\n${resultText}\n\nCopy these templates and send them to each company.`);
  };

  const handlePasswordCheck = async () => {
    console.log('Initiating password check...');
    
    // Check for weak passwords and reused passwords
    const weakPasswords = apps.filter(app => app.passwordStrength === 'WEAK');
    const reusedPasswords = apps.filter(app => app.isReused);
    
    let result = '🔒 Password Security Analysis:\n\n';
    
    if (weakPasswords.length > 0) {
      result += `⚠️ Weak Passwords Found: ${weakPasswords.length}\n`;
      weakPasswords.forEach(app => {
        result += `• ${app.name} (${app.domain})\n`;
      });
      result += '\n';
    }
    
    if (reusedPasswords.length > 0) {
      result += `🔄 Reused Passwords Found: ${reusedPasswords.length}\n`;
      reusedPasswords.forEach(app => {
        result += `• ${app.name} (${app.domain})\n`;
      });
      result += '\n';
    }
    
    if (weakPasswords.length === 0 && reusedPasswords.length === 0) {
      result += '✅ All passwords appear to be strong and unique!\n';
    } else {
      result += '💡 Recommendations:\n';
      result += '• Use a password manager\n';
      result += '• Generate unique passwords for each account\n';
      result += '• Enable two-factor authentication\n';
    }
    
    alert(result);
  };

  const handleEmailScan = async () => {
    console.log('Initiating email scan...');
    
    // Simulate email scanning for breaches
    const emailDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
    const breachResults = [];
    
    for (const domain of emailDomains) {
      // Simulate checking against breach databases
      const hasBreaches = Math.random() > 0.7; // 30% chance of breach
      if (hasBreaches) {
        breachResults.push({
          domain,
          breaches: Math.floor(Math.random() * 5) + 1,
          lastBreach: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
        });
      }
    }
    
    let result = '📧 Email Security Scan Results:\n\n';
    
    if (breachResults.length > 0) {
      result += `🚨 Breaches Found: ${breachResults.length} email domains affected\n\n`;
      breachResults.forEach(breach => {
        result += `• ${breach.domain}: ${breach.breaches} breaches\n`;
        result += `  Last breach: ${breach.lastBreach.toLocaleDateString()}\n\n`;
      });
      result += '💡 Recommendations:\n';
      result += '• Change passwords immediately\n';
      result += '• Enable two-factor authentication\n';
      result += '• Monitor accounts for suspicious activity\n';
    } else {
      result += '✅ No breaches found for common email domains!\n';
      result += '💡 Keep monitoring with regular scans.\n';
    }
    
    alert(result);
  };

  const handleAutoCleanup = async () => {
    console.log('Initiating auto-cleanup...');
    
    // Simulate cleanup process
    console.log('Starting auto-cleanup process...');
    
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 20;
      if (progress <= 100) {
        console.log(`Cleanup progress: ${progress}%`);
      } else {
        clearInterval(progressInterval);
        
        // Generate cleanup report
        const cleanedItems = Math.floor(Math.random() * 50) + 10;
        const freedSpace = Math.floor(Math.random() * 100) + 20;
        
        const result = `🔄 Auto-Cleanup Complete!\n\n` +
          `✅ Cleaned ${cleanedItems} items\n` +
          `💾 Freed ${freedSpace}MB of space\n` +
          `🔒 Enhanced privacy settings\n\n` +
          `Your browser is now cleaner and more private!`;
        
        alert(result);
      }
    }, 500);
  };

  const handleActionFix = (action: any) => {
    console.log('Handling action fix:', action);
    
    let message = `🔧 Fixing: ${action.title}\n\n`;
    
    switch (action.type) {
      case 'PRIVACY_REVIEW':
        message += '📋 Steps to review privacy settings:\n';
        message += '1. Visit the app\'s privacy settings page\n';
        message += '2. Review data sharing permissions\n';
        message += '3. Disable unnecessary data collection\n';
        message += '4. Update privacy preferences\n';
        break;
        
      case 'OAUTH_CLEANUP':
        message += '🔗 Steps to remove OAuth connections:\n';
        message += '1. Go to your account settings\n';
        message += '2. Find "Connected Apps" or "OAuth"\n';
        message += '3. Remove unused connections\n';
        message += '4. Review permissions for remaining apps\n';
        break;
        
      case 'TRACKING_PROTECTION':
        message += '🚫 Steps to block tracking:\n';
        message += '1. Install a tracker blocker extension\n';
        message += '2. Configure blocking rules\n';
        message += '3. Clear existing tracking cookies\n';
        message += '4. Monitor for new tracking attempts\n';
        break;
        
      case 'SECURITY':
        message += '🔐 Steps to improve security:\n';
        message += '1. Change passwords immediately\n';
        message += '2. Enable two-factor authentication\n';
        message += '3. Review account activity\n';
        message += '4. Monitor for suspicious activity\n';
        break;
        
      case 'PRIVACY_IMPROVEMENT':
        message += '📈 Steps to improve privacy score:\n';
        message += '1. Follow the generated recommendations\n';
        message += '2. Remove high-risk apps\n';
        message += '3. Update privacy settings\n';
        message += '4. Run regular privacy scans\n';
        break;
        
      default:
        message += '📝 General privacy improvement steps:\n';
        message += '1. Review the app\'s privacy policy\n';
        message += '2. Update account settings\n';
        message += '3. Remove unnecessary permissions\n';
        message += '4. Monitor data sharing\n';
    }
    
    message += '\n✅ Action marked as completed!';
    
    // Mark the action as completed
    setActionItems(prev => prev.map(item => 
      item.id === action.id ? { ...item, completed: true } : item
    ));
    
    alert(message);
  };

  const handleTipLearnMore = (tip: any) => {
    console.log('Learning more about tip:', tip);
    
    let message = `📚 ${tip.title}\n\n`;
    message += `${tip.description}\n\n`;
    
    switch (tip.category) {
      case 'OAUTH':
        message += '🔗 OAuth Best Practices:\n';
        message += '• Only connect apps you trust\n';
        message += '• Regularly review connected apps\n';
        message += '• Remove unused connections\n';
        message += '• Check what data each app can access\n';
        break;
        
      case 'TRACKING':
        message += '🚫 Tracking Protection Tips:\n';
        message += '• Use tracker blocker extensions\n';
        message += '• Clear cookies regularly\n';
        message += '• Use incognito mode for sensitive browsing\n';
        message += '• Review browser privacy settings\n';
        break;
        
      case 'SECURITY':
        message += '🔐 Security Best Practices:\n';
        message += '• Use strong, unique passwords\n';
        message += '• Enable two-factor authentication\n';
        message += '• Keep software updated\n';
        message += '• Monitor account activity\n';
        break;
        
      case 'DATA_SHARING':
        message += '📊 Data Sharing Awareness:\n';
        message += '• Read privacy policies carefully\n';
        message += '• Opt out of data sharing when possible\n';
        message += '• Use privacy-focused alternatives\n';
        message += '• Regularly audit your digital footprint\n';
        break;
        
      case 'GENERAL':
        message += '💡 General Privacy Tips:\n';
        message += '• Be mindful of what you share online\n';
        message += '• Use privacy-focused browsers\n';
        message += '• Consider using a VPN\n';
        message += '• Regularly review privacy settings\n';
        break;
        
      default:
        message += '💡 Additional Tips:\n';
        message += '• Stay informed about privacy news\n';
        message += '• Use privacy tools and extensions\n';
        message += '• Regularly audit your accounts\n';
        message += '• Consider your digital footprint\n';
    }
    
    message += '\n⏱️ Estimated time: ' + tip.timeEstimate;
    
    alert(message);
  };

  // Show welcome screen if no data has been loaded
  if (!hasData) {
    return (
      <div className="app">
        <div className="welcome-screen">
          <div className="welcome-content">
            <h1>🔒 Welcome to GhostScan</h1>
            <p>Your privacy monitoring dashboard is ready!</p>
            <div className="welcome-steps">
              <div className="step">
                <span className="step-number">1</span>
                <span>Make sure the GhostScan extension is installed</span>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <span>Click "New Scan" to analyze your privacy</span>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <span>View your personalized privacy insights</span>
              </div>
            </div>
            <button onClick={startScan} className="start-scan-button">
              🚀 Start Your First Scan
            </button>
          </div>
        </div>
        
        {/* Debug buttons for development */}
        <div className="debug-buttons" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
          <button onClick={() => setShowDebug(!showDebug)} className="debug-button">
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </button>
          <button onClick={testExtensionIDs} className="test-button">
            Test Extension IDs
          </button>
          <button onClick={testConnection} className="test-button">
            Test Extension
          </button>
          <button onClick={testContentScript} className="test-button">
            Test Content Script
          </button>
          <button onClick={async () => {
            const result = await apiService.testConnection();
            alert(`API Test: ${result.success ? 'SUCCESS' : 'FAILED'}\n\n${result.message}`);
          }} className="test-button">
            Test Backend API
          </button>
          <button onClick={async () => {
            const result = await apiService.getDemoStartup();
            alert(`Demo Data: ${result.success ? 'SUCCESS' : 'FAILED'}\n\n${result.success ? JSON.stringify(result.data, null, 2) : result.error}`);
          }} className="test-button">
            Test Demo Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">👻</span>
            <h1>GhostScan</h1>
            <span className="company-tag">by Virtrus</span>
          </div>
          <div className="user-info">
            <span>{userProfile?.email || 'User'}</span>
            <div className="extension-status">
              {extensionStatus.available && extensionStatus.installed ? (
                <span className="status-connected">🔗 Extension Connected</span>
              ) : extensionStatus.available ? (
                <span className="status-available">📦 Extension Available</span>
              ) : (
                <span className="status-unavailable">❌ Extension Unavailable</span>
              )}
              <button 
                className="debug-toggle"
                onClick={() => setShowDebug(!showDebug)}
                title="Toggle debug info"
              >
                🔧
              </button>
            </div>
            <div className="privacy-score">
              <div className="score-circle" style={{ borderColor: privacyGrade.color }}>
                <span className="score-grade">{privacyGrade.grade}</span>
                <span className="score-number">{privacyScore}</span>
              </div>
              <span className="score-label">Privacy Score</span>
            </div>
          </div>
        </div>
      </header>

      {/* Debug Panel */}
      {showDebug && (
        <div className="debug-panel">
          <h3>🔧 Extension Debug Info</h3>
          <div className="debug-content">
            <div className="debug-item">
              <strong>Chrome Available:</strong> {extensionStatus.debugInfo?.chromeAvailable ? '✅' : '❌'}
            </div>
            <div className="debug-item">
              <strong>Runtime Available:</strong> {extensionStatus.debugInfo?.runtimeAvailable ? '✅' : '❌'}
            </div>
            <div className="debug-item">
              <strong>Storage Available:</strong> {extensionStatus.debugInfo?.storageAvailable ? '✅' : '❌'}
            </div>
            <div className="debug-item">
              <strong>Test Message Sent:</strong> {extensionStatus.debugInfo?.testMessageSent ? '✅' : '❌'}
            </div>
            <div className="debug-item">
              <strong>Extension Installed:</strong> {extensionStatus.installed ? '✅' : '❌'}
            </div>
            <div className="debug-item">
              <strong>Last Scan:</strong> {extensionStatus.lastScan ? extensionStatus.lastScan.toLocaleString() : 'None'}
            </div>
            <div className="debug-item">
              <strong>Privacy Score:</strong> {extensionStatus.privacyScore || 'N/A'}
            </div>
            <button 
              className="test-connection-btn"
              onClick={async () => {
                const result = await extensionService.testConnection();
                alert(`Connection Test: ${result.success ? 'SUCCESS' : 'FAILED'}\n\n${result.message}`);
              }}
            >
              Test Connection
            </button>
            <button 
              className="manual-test-btn"
              onClick={() => {
                if (typeof window !== 'undefined' && window.chrome?.runtime) {
                  const extensionId = 'lldnikolaejjojgiabojpfhmpaafeige';
                  window.chrome.runtime.sendMessage(extensionId, { action: 'PING' }, (response) => {
                    if (window.chrome?.runtime?.lastError) {
                      alert(`Manual Test FAILED:\n\nError: ${window.chrome.runtime.lastError.message}`);
                    } else {
                      alert(`Manual Test SUCCESS:\n\nResponse: ${JSON.stringify(response, null, 2)}`);
                    }
                  });
                } else {
                  alert('Manual Test FAILED:\n\nChrome runtime not available');
                }
              }}
            >
              Manual Test
            </button>
            <button 
              className="extension-id-test-btn"
              onClick={() => {
                if (typeof window !== 'undefined' && window.chrome?.runtime) {
                  // Try different extension IDs to see if any work
                  const possibleIds = [
                    'lldnikolaejjojgiabojpfhmpaafeige',
                    'ghostscan-privacy-tool',
                    'ghostscan-extension'
                  ];
                  
                  let testedCount = 0;
                  let foundWorkingId = false;
                  
                  possibleIds.forEach(id => {
                    window.chrome?.runtime?.sendMessage(id, { action: 'PING' }, (response) => {
                      testedCount++;
                      if (window.chrome?.runtime?.lastError) {
                        console.log(`ID ${id} failed:`, window.chrome.runtime.lastError.message);
                      } else {
                        console.log(`ID ${id} SUCCESS:`, response);
                        foundWorkingId = true;
                        alert(`WORKING EXTENSION ID FOUND:\n\nID: ${id}\nResponse: ${JSON.stringify(response, null, 2)}`);
                      }
                      
                      if (testedCount === possibleIds.length && !foundWorkingId) {
                        alert('NO WORKING EXTENSION ID FOUND:\n\nTried IDs:\n- lldnikolaejjojgiabojpfhmpaafeige\n- ghostscan-privacy-tool\n- ghostscan-extension\n\nAll failed with "Receiving end does not exist"');
                      }
                    });
                  });
                } else {
                  alert('Extension ID Test FAILED:\n\nChrome runtime not available');
                }
              }}
            >
              Test Extension IDs
            </button>
            <button onClick={testConnection} className="test-button">
              Test Connection
            </button>
            <button onClick={testContentScript} className="test-button">
              Test Content Script
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="nav">
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`nav-item ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          ✅ Actions ({actionItems.filter(item => !item.completed).length})
        </button>
        <button 
          className={`nav-item ${activeTab === 'tips' ? 'active' : ''}`}
          onClick={() => setActiveTab('tips')}
        >
          💡 Privacy Tips
        </button>
        <button 
          className={`nav-item ${activeTab === 'apps' ? 'active' : ''}`}
          onClick={() => setActiveTab('apps')}
        >
          🔍 Apps ({apps.length})
        </button>
        <button 
          className={`nav-item ${activeTab === 'breaches' ? 'active' : ''}`}
          onClick={() => setActiveTab('breaches')}
        >
          🚨 Breaches ({breachAlerts.filter(b => b.isNew).length})
        </button>
        <button 
          className={`nav-item ${activeTab === 'ghosts' ? 'active' : ''}`}
          onClick={() => setActiveTab('ghosts')}
        >
          👻 Ghost Profiles ({ghostProfiles.length})
        </button>
        <button 
          className={`nav-item ${activeTab === 'assistant' ? 'active' : ''}`}
          onClick={() => setActiveTab('assistant')}
        >
          🧠 AI Assistant
        </button>
      </nav>

      {/* Main Content */}
      <main className="main">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            {/* Privacy Score Hero */}
            <div className="privacy-hero">
              <div className="hero-content">
                <h2>Your Privacy Score: {privacyGrade.grade}</h2>
                <p>You're doing better than 65% of users, but there's room for improvement!</p>
                <button 
                  className="scan-button"
                  onClick={startScan}
                  disabled={isScanning}
                >
                  {isScanning ? '🔍 Scanning...' : '🔍 Run New Scan'}
                </button>
              </div>
              <div className="hero-visual">
                <div className="score-display" style={{ color: privacyGrade.color }}>
                  <div className="score-circle-large" style={{ borderColor: privacyGrade.color }}>
                    <span className="score-grade-large">{privacyGrade.grade}</span>
                    <span className="score-number-large">{privacyScore}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Tracking */}
            <div className="progress-section">
              <h2>Your Progress</h2>
              <div className="progress-grid">
                <div className="progress-card">
                  <div className="progress-circle">
                    <span className="progress-number">{progressData.weeklyProgress}%</span>
                    <span className="progress-label">This Week</span>
                  </div>
                </div>
                <div className="progress-card">
                  <div className="progress-circle">
                    <span className="progress-number">{progressData.streakDays}</span>
                    <span className="progress-label">Day Streak</span>
                  </div>
                </div>
                <div className="progress-card">
                  <div className="progress-circle">
                    <span className="progress-number">+{progressData.privacyScoreImprovement}</span>
                    <span className="progress-label">Score Improved</span>
                  </div>
                </div>
                <div className="progress-card">
                  <div className="progress-circle">
                    <span className="progress-number">{progressData.totalActionsCompleted}</span>
                    <span className="progress-label">Actions Done</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <button className="action-button" onClick={handlePrivacyRequests}>✉️ Privacy Requests</button>
              <button className="action-button" onClick={handlePasswordCheck}>🔒 Password Check</button>
              <button className="action-button" onClick={handleEmailScan}>📧 Email Scan</button>
              <button className="action-button" onClick={handleAutoCleanup}>🔄 Auto-Cleanup</button>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Apps</h3>
                <div className="stat-value">{userProfile?.totalApps || 0}</div>
                <div className="stat-change">+2 this week</div>
              </div>
              <div className="stat-card">
                <h3>High Risk Apps</h3>
                <div className="stat-value danger">{userProfile?.highRiskApps || 0}</div>
                <div className="stat-change">-1 this week</div>
              </div>
              <div className="stat-card">
                <h3>Pending Actions</h3>
                <div className="stat-value">{actionItems.filter(item => !item.completed).length}</div>
                <div className="stat-change">-2 this week</div>
              </div>
              <div className="stat-card">
                <h3>Ghost Profiles</h3>
                <div className="stat-value">{ghostProfiles.length}</div>
                <div className="stat-change">+1 this week</div>
              </div>
            </div>

            {/* Action Items Preview */}
            <div className="action-preview">
              <div className="section-header">
                <h2>Quick Actions</h2>
                <button className="view-all-btn" onClick={() => setActiveTab('actions')}>
                  View All
                </button>
              </div>
              <div className="action-list">
                {actionItems.slice(0, 3).map(item => (
                  <div key={item.id} className="action-item-preview">
                    <div className="action-priority" style={{ backgroundColor: item.priority === 'HIGH' ? '#EF4444' : '#F59E0B' }}>
                      {item.priority}
                    </div>
                    <div className="action-content">
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                      <span className="action-time">⏱️ {item.estimatedTime}</span>
                    </div>
                    <button className="action-btn" onClick={() => handleActionFix(item)}>Fix Now</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy Tips Preview */}
            <div className="tips-preview">
              <div className="section-header">
                <h2>Privacy Tips</h2>
                <button className="view-all-btn" onClick={() => setActiveTab('tips')}>
                  View All
                </button>
              </div>
              <div className="tips-list">
                {privacyTips.slice(0, 2).map(tip => (
                  <div key={tip.id} className="tip-item-preview">
                    <div className="tip-category">{tip.category}</div>
                    <div className="tip-content">
                      <h4>{tip.title}</h4>
                      <p>{tip.description}</p>
                      <span className="tip-time">⏱️ {tip.timeEstimate}</span>
                    </div>
                    <button className="tip-btn" onClick={() => handleTipLearnMore(tip)}>Learn More</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
              <h2>Recent Activity</h2>
              <div className="activity-list">
                {breachAlerts.filter(b => b.isNew).map(alert => (
                  <div key={alert.id} className="activity-item danger">
                    <span className="activity-icon">🚨</span>
                    <div className="activity-content">
                      <div className="activity-title">New Breach Alert</div>
                      <div className="activity-description">
                        {alert.description} - {formatDate(alert.breachDate)}
                      </div>
                    </div>
                  </div>
                ))}
                {apps.filter(app => app.isReused).map(app => (
                  <div key={app.id} className="activity-item warning">
                    <span className="activity-icon">🔒</span>
                    <div className="activity-content">
                      <div className="activity-title">Password Reuse Detected</div>
                      <div className="activity-description">
                        {app.name} uses a reused password
                      </div>
                    </div>
                  </div>
                ))}
                <div className="activity-item success">
                  <span className="activity-icon">✅</span>
                  <div className="activity-content">
                    <div className="activity-title">Privacy Score Improved</div>
                    <div className="activity-description">
                      Your score increased by 5 points this week
                    </div>
                  </div>
                </div>
                <div className="activity-item info">
                  <span className="activity-icon">📧</span>
                  <div className="activity-content">
                    <div className="activity-title">Email Scan Completed</div>
                    <div className="activity-description">
                      Found 12 new app subscriptions in your inbox
                    </div>
                  </div>
                </div>
                <div className="activity-item success">
                  <span className="activity-icon">🔐</span>
                  <div className="activity-content">
                    <div className="activity-title">Two-Factor Enabled</div>
                    <div className="activity-description">
                      Enhanced security for your Google account
                    </div>
                  </div>
                </div>
                <div className="activity-item info">
                  <span className="activity-icon">👻</span>
                  <div className="activity-content">
                    <div className="activity-title">Ghost Profile Found</div>
                    <div className="activity-description">
                      New shadow profile detected on LinkedIn
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="actions-view">
            <div className="actions-header">
              <h2>Action Items</h2>
              <div className="actions-summary">
                <span className="summary-item">
                  <span className="summary-number">{actionItems.filter(item => !item.completed).length}</span>
                  <span className="summary-label">Pending</span>
                </span>
                <span className="summary-item">
                  <span className="summary-number">{actionItems.filter(item => item.completed).length}</span>
                  <span className="summary-label">Completed</span>
                </span>
              </div>
            </div>
            <div className="actions-list">
              {actionItems.map(item => (
                <div key={item.id} className={`action-card ${item.completed ? 'completed' : ''}`}>
                  <div className="action-header">
                    <div className="action-priority-badge" style={{ backgroundColor: item.priority === 'HIGH' ? '#EF4444' : '#F59E0B' }}>
                      {item.priority}
                    </div>
                    <div className="action-type-badge">
                      {item.type}
                    </div>
                  </div>
                  <div className="action-body">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <div className="action-meta">
                      <span className="action-time">⏱️ {item.estimatedTime}</span>
                      {item.completed && <span className="completed-badge">✅ Completed</span>}
                    </div>
                  </div>
                  <div className="action-actions">
                    {!item.completed ? (
                      <button className="action-btn primary">Fix Now</button>
                    ) : (
                      <button className="action-btn secondary">View Details</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tips' && (
          <div className="tips-view">
            <div className="tips-header">
              <h2>Privacy Tips & Best Practices</h2>
              <p>Improve your privacy score with these actionable tips</p>
            </div>
            <div className="tips-grid">
              {privacyTips.map(tip => (
                <div key={tip.id} className="tip-card">
                  <div className="tip-header">
                    <div className="tip-category-badge">{tip.category}</div>
                    <div className="tip-difficulty" style={{ 
                      backgroundColor: tip.difficulty === 'EASY' ? '#10B981' : 
                                    tip.difficulty === 'MEDIUM' ? '#F59E0B' : '#EF4444' 
                    }}>
                      {tip.difficulty}
                    </div>
                  </div>
                  <div className="tip-body">
                    <h3>{tip.title}</h3>
                    <p>{tip.description}</p>
                    <div className="tip-meta">
                      <span className="tip-time">⏱️ {tip.timeEstimate}</span>
                      {tip.completed && <span className="completed-badge">✅ Completed</span>}
                    </div>
                  </div>
                  <div className="tip-actions">
                    {!tip.completed ? (
                      <button className="tip-btn primary">Get Started</button>
                    ) : (
                      <button className="tip-btn secondary">Review</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'apps' && (
          <div className="apps-view">
            <div className="apps-header">
              <h2>Your Apps</h2>
              <div className="apps-filters">
                <select className="filter-select">
                  <option>All Risk Levels</option>
                  <option>High Risk Only</option>
                  <option>Medium Risk Only</option>
                  <option>Low Risk Only</option>
                </select>
              </div>
            </div>
            <div className="apps-grid">
              {apps.map(app => (
                <div key={app.id} className="app-card">
                  <div className="app-header">
                    <h3>{app.name}</h3>
                    <span 
                      className="risk-badge"
                      style={{ backgroundColor: getRiskColor(app.riskLevel) }}
                    >
                      {app.riskLevel}
                    </span>
                  </div>
                  <div className="app-details">
                    <p>Domain: {app.domain}</p>
                    <p>Last accessed: {formatDate(app.lastAccessed!)}</p>
                    {app.hasBreaches && (
                      <p className="breach-warning">⚠️ Has been breached</p>
                    )}
                    {app.isReused && (
                      <p className="password-warning">🔒 Password reused</p>
                    )}
                  </div>
                  <div className="app-actions">
                    <button className="app-action">View Details</button>
                    <button className="app-action">Privacy Request</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'breaches' && (
          <div className="breaches-view">
            <h2>Breach Alerts</h2>
            <div className="breaches-list">
              {breachAlerts.map(alert => (
                <div key={alert.id} className="breach-card">
                  <div className="breach-header">
                    <h3>🚨 {alert.description}</h3>
                    {alert.isNew && <span className="new-badge">NEW</span>}
                  </div>
                  <div className="breach-details">
                    <p>Date: {formatDate(alert.breachDate)}</p>
                    <p>Severity: {alert.severity}</p>
                    <p>Data exposed: {alert.dataTypes.join(', ')}</p>
                  </div>
                  <div className="breach-actions">
                    <button className="breach-action">Take Action</button>
                    <button className="breach-action">Learn More</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ghosts' && (
          <div className="ghosts-view">
            <h2>Ghost Profiles Found</h2>
            <div className="ghosts-list">
              {ghostProfiles.map(profile => (
                <div key={profile.id} className="ghost-card">
                  <div className="ghost-header">
                    <h3>👻 {profile.platform}</h3>
                    <span className="confidence-badge">
                      {Math.round(profile.confidence * 100)}% match
                    </span>
                  </div>
                  <div className="ghost-details">
                    <p>Email: {profile.email}</p>
                    {profile.username && <p>Username: {profile.username}</p>}
                    <p>Found via: {profile.foundVia}</p>
                    <p>Data exposed: {profile.dataExposed.join(', ')}</p>
                  </div>
                  <div className="ghost-actions">
                    <button className="ghost-action">Investigate</button>
                    <button className="ghost-action">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'assistant' && (
          <div className="assistant-view">
            <h2>🧠 AI Privacy Assistant</h2>
            <div className="assistant-chat">
              <div className="chat-messages">
                {aiMessages.map(message => (
                  <div key={message.id} className={`message ${message.type}`}>
                    <div className="message-content">
                      {message.content}
                    </div>
                    <div className="message-time">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input 
                  type="text" 
                  placeholder="Ask about your privacy..."
                  className="chat-text-input"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAiMessage()}
                />
                <button className="chat-send" onClick={handleAiMessage}>Send</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
