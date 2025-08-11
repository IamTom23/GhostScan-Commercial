import { useState, useEffect } from 'react';
import './App.css';
import { Onboarding } from './components/Onboarding';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';
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

// Enhanced Security Score System (Defender for Cloud style)
interface SecurityScoreBreakdown {
  overallScore: number;
  overallGrade: string;
  dimensions: {
    oauthRiskScore: number;
    dataExposureScore: number;
    complianceScore: number;
    accessControlScore: number;
  };
  recommendations: string[];
  riskFactors: string[];
  improvements: {
    shortTerm: string[];
    longTerm: string[];
  };
}

const calculateOAuthRiskScore = (apps: SaaSApp[]): number => {
  if (apps.length === 0) return 85; // Good score for no apps
  
  let totalRisk = 0;
  let weightedTotal = 0;
  
  apps.forEach(app => {
    let appRisk = 0;
    let weight = 1;
    
    // Base risk by level
    switch (app.riskLevel) {
      case 'CRITICAL': appRisk = 10; weight = 3; break;
      case 'HIGH': appRisk = 25; weight = 2.5; break;
      case 'MEDIUM': appRisk = 50; weight = 2; break;
      case 'LOW': appRisk = 80; weight = 1; break;
    }
    
    // Risk modifiers
    if (app.hasBreaches) appRisk -= 20;
    if (app.thirdPartySharing) appRisk -= 10;
    if (app.passwordStrength === 'WEAK') appRisk -= 15;
    if (app.accountStatus === 'INACTIVE') appRisk -= 5;
    
    // Data sensitivity modifier
    const sensitiveDataTypes = ['financial', 'personal', 'medical', 'legal'];
    const hasSensitiveData = app.dataTypes.some(type => sensitiveDataTypes.includes(type));
    if (hasSensitiveData) weight *= 1.5;
    
    totalRisk += Math.max(0, Math.min(100, appRisk)) * weight;
    weightedTotal += weight;
  });
  
  return Math.round(totalRisk / weightedTotal);
};

const calculateDataExposureScore = (apps: SaaSApp[], ghostProfiles: GhostProfile[]): number => {
  let baseScore = 90;
  
  // Penalize for breached apps
  const breachedApps = apps.filter(app => app.hasBreaches);
  baseScore -= breachedApps.length * 15;
  
  // Penalize for data sharing
  const sharingApps = apps.filter(app => app.thirdPartySharing);
  baseScore -= sharingApps.length * 8;
  
  // Penalize for ghost profiles
  baseScore -= ghostProfiles.length * 10;
  
  // Bonus for good data practices
  const secureApps = apps.filter(app => 
    !app.hasBreaches && 
    !app.thirdPartySharing && 
    app.riskLevel === 'LOW'
  );
  baseScore += Math.min(20, secureApps.length * 2);
  
  return Math.max(0, Math.min(100, Math.round(baseScore)));
};

const calculateComplianceScore = (apps: SaaSApp[]): number => {
  let baseScore = 70; // Neutral starting point
  
  if (apps.length === 0) return 95; // High score for clean state
  
  // Check for compliance-friendly practices
  const lowRiskApps = apps.filter(app => app.riskLevel === 'LOW');
  const highRiskApps = apps.filter(app => ['HIGH', 'CRITICAL'].includes(app.riskLevel));
  
  // Scoring based on risk distribution
  const lowRiskRatio = lowRiskApps.length / apps.length;
  const highRiskRatio = highRiskApps.length / apps.length;
  
  baseScore += lowRiskRatio * 25; // Bonus for low risk apps
  baseScore -= highRiskRatio * 30; // Penalty for high risk apps
  
  // Additional compliance factors
  const noBreachApps = apps.filter(app => !app.hasBreaches);
  const noSharingApps = apps.filter(app => !app.thirdPartySharing);
  
  baseScore += (noBreachApps.length / apps.length) * 15;
  baseScore += (noSharingApps.length / apps.length) * 10;
  
  return Math.max(30, Math.min(100, Math.round(baseScore)));
};

const calculateAccessControlScore = (apps: SaaSApp[]): number => {
  let baseScore = 80;
  
  if (apps.length === 0) return 95;
  
  // Check authentication strength
  const strongAuthApps = apps.filter(app => app.passwordStrength === 'STRONG');
  const weakAuthApps = apps.filter(app => app.passwordStrength === 'WEAK');
  
  baseScore += (strongAuthApps.length / apps.length) * 15;
  baseScore -= (weakAuthApps.length / apps.length) * 25;
  
  // Active vs inactive accounts
  const inactiveApps = apps.filter(app => app.accountStatus === 'INACTIVE');
  
  baseScore -= inactiveApps.length * 5; // Penalty for unused accounts
  
  // OAuth provider diversity (single sign-on is better)
  const oauthProviders = new Set(apps.map(app => app.oauthProvider).filter(Boolean));
  if (oauthProviders.size === 1 && oauthProviders.has('Google')) baseScore += 10;
  
  return Math.max(40, Math.min(100, Math.round(baseScore)));
};

const getSecurityGrade = (score: number): { grade: string; color: string; description: string } => {
  if (score >= 90) return { grade: 'A+', color: '#10B981', description: 'Excellent' };
  if (score >= 85) return { grade: 'A', color: '#10B981', description: 'Very Good' };
  if (score >= 80) return { grade: 'A-', color: '#059669', description: 'Good' };
  if (score >= 75) return { grade: 'B+', color: '#84CC16', description: 'Above Average' };
  if (score >= 70) return { grade: 'B', color: '#EAB308', description: 'Average' };
  if (score >= 65) return { grade: 'B-', color: '#F59E0B', description: 'Below Average' };
  if (score >= 60) return { grade: 'C+', color: '#F97316', description: 'Needs Improvement' };
  if (score >= 55) return { grade: 'C', color: '#EF4444', description: 'Poor' };
  if (score >= 50) return { grade: 'C-', color: '#DC2626', description: 'Very Poor' };
  if (score >= 40) return { grade: 'D', color: '#B91C1C', description: 'Critical' };
  return { grade: 'F', color: '#7F1D1D', description: 'Failed' };
};

const calculateEnhancedSecurityScore = (
  apps: SaaSApp[], 
  ghostProfiles: GhostProfile[]
): SecurityScoreBreakdown => {
  // Calculate individual dimension scores
  const oauthRiskScore = calculateOAuthRiskScore(apps);
  const dataExposureScore = calculateDataExposureScore(apps, ghostProfiles);
  const complianceScore = calculateComplianceScore(apps);
  const accessControlScore = calculateAccessControlScore(apps);
  
  // Weight the scores (similar to Defender for Cloud)
  const weights = {
    oauth: 0.40,      // 40% - Most critical for SaaS security
    dataExposure: 0.25, // 25% - Data protection is crucial
    compliance: 0.20,   // 20% - Regulatory requirements
    accessControl: 0.15 // 15% - Authentication and access
  };
  
  const overallScore = Math.round(
    oauthRiskScore * weights.oauth +
    dataExposureScore * weights.dataExposure +
    complianceScore * weights.compliance +
    accessControlScore * weights.accessControl
  );
  
  const overallGrade = getSecurityGrade(overallScore).grade;
  
  // Generate recommendations based on lowest scores
  const recommendations: string[] = [];
  const riskFactors: string[] = [];
  const improvements: { shortTerm: string[]; longTerm: string[] } = { shortTerm: [], longTerm: [] };
  
  if (oauthRiskScore < 70) {
    recommendations.push('Review and revoke unnecessary OAuth permissions');
    riskFactors.push('High-risk OAuth connections detected');
    improvements.shortTerm.push('Audit OAuth app permissions');
  }
  
  if (dataExposureScore < 70) {
    recommendations.push('Address data exposure vulnerabilities');
    riskFactors.push('Potential data exposure through connected apps');
    improvements.shortTerm.push('Review apps with data sharing enabled');
  }
  
  if (complianceScore < 70) {
    recommendations.push('Improve compliance posture');
    riskFactors.push('Non-compliant applications in use');
    improvements.longTerm.push('Implement compliance monitoring');
  }
  
  if (accessControlScore < 70) {
    recommendations.push('Strengthen access controls');
    riskFactors.push('Weak authentication practices detected');
    improvements.shortTerm.push('Enable multi-factor authentication');
  }
  
  // Add general improvements
  improvements.longTerm.push('Implement regular security reviews');
  improvements.longTerm.push('Establish security policies for new apps');
  
  return {
    overallScore,
    overallGrade,
    dimensions: {
      oauthRiskScore,
      dataExposureScore,
      complianceScore,
      accessControlScore
    },
    recommendations,
    riskFactors,
    improvements
  };
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
  const { user, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Debug: Reset onboarding with Ctrl+O
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'o') {
        setShowOnboarding(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [apps, setApps] = useState<SaaSApp[]>([]);
  const [breachAlerts, setBreachAlerts] = useState<BreachAlert[]>([]);
  const [ghostProfiles] = useState<GhostProfile[]>([]);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [privacyTips, setPrivacyTips] = useState<any[]>([]);
  const [progressData] = useState(mockProgressData);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isScanning, setIsScanning] = useState(false);
  const [hasData, setHasData] = useState(false);


  // Load demo data from backend API on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Always try to load demo data from backend API first
        console.log('Loading demo data from backend API...');
        
        try {
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
              console.log('Successfully loaded demo data from API:', dashboardData);
              return;
            }
          }
        } catch (apiError) {
          console.log('API not available:', apiError);
        }

        // If API fails, still show the dashboard with minimal data
        console.log('API not available, showing demo data message');
        setHasData(true); // Show dashboard anyway
        
      } catch (error) {
        console.error('Error loading data:', error);
        // Even on error, show the dashboard
        setHasData(true);
      }
    };

    loadData();
  }, []);

  const startScan = async () => {
    setIsScanning(true);
    console.log('Starting scan...');
    
    try {
      // First try to refresh data from backend API
      console.log('Refreshing data from backend API...');
      
      try {
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
            console.log('Scan completed with API data:', dashboardData);
            setIsScanning(false);
            return;
          }
        }
      } catch (apiError) {
        console.log('API scan failed:', apiError);
        // Just refresh the page state to show updated data
        setHasData(true);
      }
    } catch (error) {
      console.error('Error during scan:', error);
      // Even on error, make sure we show the dashboard
      setHasData(true);
    } finally {
      setIsScanning(false);
    }
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


  const handleComplianceReport = async () => {
    console.log('Generating compliance report...');
    
    const report = `📊 GDPR Compliance Report\n\n` +
      `✅ Compliant Apps: ${apps.filter(app => !app.thirdPartySharing).length}\n` +
      `⚠️ Needs Review: ${apps.filter(app => app.thirdPartySharing).length}\n` +
      `🚨 High Risk: ${apps.filter(app => app.riskLevel === 'HIGH' || app.riskLevel === 'CRITICAL').length}\n\n` +
      `Recommendations:\n` +
      `• Review data processing agreements\n` +
      `• Update privacy policies\n` +
      `• Implement data retention policies\n` +
      `• Train staff on GDPR requirements\n\n` +
      `Report generated: ${new Date().toLocaleDateString()}`;
    
    alert(report);
  };

  const handleRevokeAccess = async () => {
    console.log('Scanning for unused access...');
    
    const unusedApps = apps.filter(app => {
      const daysSinceAccess = Math.floor((Date.now() - new Date(app.lastAccessed).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceAccess > 30;
    });
    
    const result = `🔐 Access Review Complete\n\n` +
      `${unusedApps.length} applications haven't been used in 30+ days:\n\n` +
      unusedApps.map(app => `• ${app.name} (last used ${Math.floor((Date.now() - new Date(app.lastAccessed).getTime()) / (1000 * 60 * 60 * 24))} days ago)`).join('\n') +
      `\n\nRecommendation: Review these applications and revoke access if no longer needed.`;
    
    alert(result);
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
        message += '1. Configure browser privacy settings\n';
        message += '2. Enable tracker blocking in browser\n';
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
        message += '• Enable browser tracking protection\n';
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
        message += '• Use privacy tools and settings\n';
        message += '• Regularly audit your accounts\n';
        message += '• Consider your digital footprint\n';
    }
    
    message += '\n⏱️ Estimated time: ' + tip.timeEstimate;
    
    alert(message);
  };

  // Show loading spinner while authentication is being checked
  if (isLoading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-content">
            <h1>☁️ Cloudyx</h1>
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
            <p>Loading your security dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication page if user is not logged in
  if (!user) {
    return <AuthPage />;
  }

  // Show welcome screen if no data has been loaded
  if (!hasData) {
    return (
      <div className="app">
        <div className="welcome-screen">
          <div className="welcome-content">
            <h1>☁️ Welcome to Cloudyx</h1>
            <p>Your cloud security dashboard is ready to protect your organization!</p>
            <div className="welcome-steps">
              <div className="step">
                <span className="step-number">1</span>
                <span>Configure your cloud security monitoring</span>
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

  // Show onboarding for new users
  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  // Calculate enhanced security score
  const securityScoreBreakdown = calculateEnhancedSecurityScore(apps, ghostProfiles);
  const privacyScore = securityScoreBreakdown.overallScore;
  const privacyGrade = getSecurityGrade(privacyScore);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">☁️</span>
            <h1>Cloudyx</h1>
            <span className="company-tag">SaaS Security Management</span>
          </div>
          <div className="user-info">
            <div className="admin-badge">
              <span className="role-indicator">🛡️ Security Admin</span>
              <span className="user-email">{userProfile?.email || 'admin@company.com'}</span>
            </div>
            <div className="threat-score">
              <div 
                className="score-circle clickable" 
                style={{ borderColor: privacyGrade.color }}
                onClick={() => setActiveTab('threat-info')}
                title="Click to learn about threat levels"
              >
                <span className="score-grade">{privacyGrade.grade}</span>
                <span className="score-number">{privacyScore}</span>
              </div>
            </div>
          </div>
        </div>
      </header>


      {/* Navigation */}
      <nav className="nav">
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span>📊</span>
          <span>App Security Overview</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'apps' ? 'active' : ''}`}
          onClick={() => setActiveTab('apps')}
        >
          <span>📱</span>
          <span>Connected Apps</span>
          <span className="nav-badge">({apps.length})</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'threats' ? 'active' : ''}`}
          onClick={() => setActiveTab('threats')}
        >
          <span>🚨</span>
          <span>Risky Permissions</span>
          <span className="nav-badge">({actionItems.filter(item => !item.completed).length})</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'exposure' ? 'active' : ''}`}
          onClick={() => setActiveTab('exposure')}
        >
          <span>🔍</span>
          <span>Data Access</span>
          <span className="nav-badge">({ghostProfiles.length})</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'intel' ? 'active' : ''}`}
          onClick={() => setActiveTab('intel')}
        >
          <span>⚠️</span>
          <span>Security Alerts</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          <span>⚙️</span>
          <span>Access Controls</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'threat-info' ? 'active' : ''}`}
          onClick={() => setActiveTab('threat-info')}
        >
          <span>🛡️</span>
          <span>Threat Levels Guide</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="main">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            {/* Security Status Hero */}
            <div className="security-hero">
              <div className="hero-content">
                <h2>Organization Security Grade: {privacyGrade.grade}</h2>
                <p>Cloud security assessment for TechFlow Startup - 12 employees monitored</p>
                <div className="scan-controls">
                  <button 
                    className="scan-button primary"
                    onClick={startScan}
                    disabled={isScanning}
                  >
                    {isScanning ? '🔍 Scanning Cloud Apps...' : '🔍 Run Security Scan'}
                  </button>
                  <div className="scan-status">
                    <span className="last-scan-label">Last scan:</span>
                    <span className="last-scan-time">{userProfile?.lastScanDate ? formatDate(userProfile.lastScanDate) : '2 days ago'}</span>
                  </div>
                </div>
              </div>
              <div className="hero-visual">
                <div className="threat-display" style={{ color: privacyGrade.color }}>
                  <div className="threat-indicator-large" style={{ borderColor: privacyGrade.color }}>
                    {/* Clean threat indicator circle - no text */}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Security Score Breakdown */}
            <div className="security-score-section">
              <h2>🛡️ Security Score Breakdown</h2>
              <div className="score-dimensions-grid">
                <div className="score-dimension-card">
                  <div className="dimension-header">
                    <span className="dimension-icon">🔗</span>
                    <h3>OAuth Risk</h3>
                    <span className="dimension-weight">40%</span>
                  </div>
                  <div className="dimension-score">
                    <div className="score-circle-small" style={{ borderColor: getSecurityGrade(securityScoreBreakdown.dimensions.oauthRiskScore).color }}>
                      <span className="score-grade">{getSecurityGrade(securityScoreBreakdown.dimensions.oauthRiskScore).grade}</span>
                    </div>
                    <span className="score-number">{securityScoreBreakdown.dimensions.oauthRiskScore}/100</span>
                  </div>
                  <p className="dimension-description">App permissions and OAuth connections</p>
                </div>
                
                <div className="score-dimension-card">
                  <div className="dimension-header">
                    <span className="dimension-icon">🔒</span>
                    <h3>Data Exposure</h3>
                    <span className="dimension-weight">25%</span>
                  </div>
                  <div className="dimension-score">
                    <div className="score-circle-small" style={{ borderColor: getSecurityGrade(securityScoreBreakdown.dimensions.dataExposureScore).color }}>
                      <span className="score-grade">{getSecurityGrade(securityScoreBreakdown.dimensions.dataExposureScore).grade}</span>
                    </div>
                    <span className="score-number">{securityScoreBreakdown.dimensions.dataExposureScore}/100</span>
                  </div>
                  <p className="dimension-description">Data breaches and sharing risks</p>
                </div>
                
                <div className="score-dimension-card">
                  <div className="dimension-header">
                    <span className="dimension-icon">📋</span>
                    <h3>Compliance</h3>
                    <span className="dimension-weight">20%</span>
                  </div>
                  <div className="dimension-score">
                    <div className="score-circle-small" style={{ borderColor: getSecurityGrade(securityScoreBreakdown.dimensions.complianceScore).color }}>
                      <span className="score-grade">{getSecurityGrade(securityScoreBreakdown.dimensions.complianceScore).grade}</span>
                    </div>
                    <span className="score-number">{securityScoreBreakdown.dimensions.complianceScore}/100</span>
                  </div>
                  <p className="dimension-description">Regulatory compliance status</p>
                </div>
                
                <div className="score-dimension-card">
                  <div className="dimension-header">
                    <span className="dimension-icon">🔐</span>
                    <h3>Access Control</h3>
                    <span className="dimension-weight">15%</span>
                  </div>
                  <div className="dimension-score">
                    <div className="score-circle-small" style={{ borderColor: getSecurityGrade(securityScoreBreakdown.dimensions.accessControlScore).color }}>
                      <span className="score-grade">{getSecurityGrade(securityScoreBreakdown.dimensions.accessControlScore).grade}</span>
                    </div>
                    <span className="score-number">{securityScoreBreakdown.dimensions.accessControlScore}/100</span>
                  </div>
                  <p className="dimension-description">Authentication and authorization</p>
                </div>
              </div>
              
              {/* Security Recommendations */}
              {securityScoreBreakdown.recommendations.length > 0 && (
                <div className="security-recommendations">
                  <h3>🎯 Priority Recommendations</h3>
                  <div className="recommendations-list">
                    {securityScoreBreakdown.recommendations.map((recommendation, index) => (
                      <div key={index} className="recommendation-item">
                        <span className="recommendation-icon">⚠️</span>
                        <span className="recommendation-text">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

            {/* Security Actions */}
            <div className="security-actions">
              <h3>🛡️ Security Operations</h3>
              <div className="action-grid">
                <button className="action-button critical" onClick={handleRevokeAccess}>
                  <span className="action-icon">🔐</span>
                  <span className="action-text">Revoke Risky Access</span>
                </button>
                <button className="action-button high" onClick={handlePasswordCheck}>
                  <span className="action-icon">🔒</span>
                  <span className="action-text">Security Audit</span>
                </button>
                <button className="action-button medium" onClick={handleComplianceReport}>
                  <span className="action-icon">📊</span>
                  <span className="action-text">Generate Report</span>
                </button>
                <button className="action-button low" onClick={handlePrivacyRequests}>
                  <span className="action-icon">⚙️</span>
                  <span className="action-text">Policy Actions</span>
                </button>
              </div>
            </div>

            {/* Security Metrics */}
            <div className="security-metrics">
              <h3>📊 Security Metrics</h3>
              <div className="metrics-grid">
                <div className="metric-card threat-level">
                  <div className="metric-header">
                    <span className="metric-icon">☁️</span>
                    <span className="metric-title">Cloud Apps Monitored</span>
                  </div>
                  <div className="metric-value">{userProfile?.totalApps || 0}</div>
                  <div className="metric-change positive">+2 discovered this week</div>
                </div>
                <div className="metric-card critical">
                  <div className="metric-header">
                    <span className="metric-icon">🚨</span>
                    <span className="metric-title">Critical Threats</span>
                  </div>
                  <div className="metric-value danger">{apps.filter(app => app.riskLevel === 'CRITICAL').length}</div>
                  <div className="metric-change">Requires immediate action</div>
                </div>
                <div className="metric-card high-risk">
                  <div className="metric-header">
                    <span className="metric-icon">⚠️</span>
                    <span className="metric-title">High Risk Apps</span>
                  </div>
                  <div className="metric-value warning">{userProfile?.highRiskApps || 0}</div>
                  <div className="metric-change positive">1 mitigated this week</div>
                </div>
                <div className="metric-card security-score">
                  <div className="metric-header">
                    <span className="metric-icon">🛡️</span>
                    <span className="metric-title">Security Posture</span>
                  </div>
                  <div className="metric-value">{Math.max(85, 100 - (userProfile?.highRiskApps || 0) * 5)}%</div>
                  <div className="metric-change positive">+3% improvement</div>
                </div>
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
                  <span className="activity-icon">🔍</span>
                  <div className="activity-content">
                    <div className="activity-title">Compliance Scan Completed</div>
                    <div className="activity-description">
                      Reviewed 15 applications for GDPR compliance
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'threats' && (
          <div className="threats-view">
            <div className="threats-header">
              <h2>🚨 Active Security Threats</h2>
              <div className="threat-summary">
                <span className="summary-item critical">
                  <span className="summary-number">{actionItems.filter(item => !item.completed && item.priority === 'CRITICAL').length}</span>
                  <span className="summary-label">Critical</span>
                </span>
                <span className="summary-item high">
                  <span className="summary-number">{actionItems.filter(item => !item.completed && item.priority === 'HIGH').length}</span>
                  <span className="summary-label">High</span>
                </span>
                <span className="summary-item medium">
                  <span className="summary-number">{actionItems.filter(item => !item.completed && item.priority === 'MEDIUM').length}</span>
                  <span className="summary-label">Medium</span>
                </span>
                <span className="summary-item resolved">
                  <span className="summary-number">{actionItems.filter(item => item.completed).length}</span>
                  <span className="summary-label">Resolved</span>
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

        {activeTab === 'exposure' && (
          <div className="exposure-view">
            <h2>🔍 Public Data Exposure Analysis</h2>
            <div className="exposure-info">
              <p>Comprehensive scan results showing your organization's publicly visible data, credentials, and potential security exposures across the web.</p>
            </div>
            {ghostProfiles.length === 0 ? (
              <div className="no-exposure">
                <div className="empty-state">
                  <span className="empty-icon">🔒</span>
                  <h3>Excellent Security Posture</h3>
                  <p>Our comprehensive scan found no publicly exposed credentials, data leaks, or security vulnerabilities associated with your organization. Your digital footprint appears well-secured.</p>
                  <div className="security-metrics">
                    <div className="metric">
                      <span className="metric-label">Domains Scanned</span>
                      <span className="metric-value">15</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Data Sources Checked</span>
                      <span className="metric-value">47</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Last Scan</span>
                      <span className="metric-value">2 hours ago</span>
                    </div>
                  </div>
                  <button className="scan-button" onClick={() => alert('Enhanced deep scan initiated - monitoring 150+ additional sources')}>
                    🔍 Run Enhanced Deep Scan
                  </button>
                </div>
              </div>
            ) : (
              <div className="exposure-list">
                {ghostProfiles.map(profile => (
                  <div key={profile.id} className="exposure-card">
                    <div className="exposure-header">
                      <h3>🔍 {profile.platform}</h3>
                      <span className="confidence-badge">
                        {Math.round(profile.confidence * 100)}% confidence
                      </span>
                    </div>
                    <div className="exposure-details">
                      <p>Email: {profile.email}</p>
                      {profile.username && <p>Username: {profile.username}</p>}
                      <p>Found via: {profile.foundVia}</p>
                      <p>Data exposed: {profile.dataExposed.join(', ')}</p>
                    </div>
                    <div className="exposure-actions">
                      <button className="exposure-action">Verify</button>
                      <button className="exposure-action">Request Removal</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'intel' && (
          <div className="intel-view">
            <h2>⚠️ SaaS Security Alerts</h2>
            <div className="intel-grid">
              <div className="intel-section">
                <h3>🚨 Critical App Risks</h3>
                <div className="intel-cards">
                  <div className="intel-card critical">
                    <div className="intel-header">
                      <span className="intel-date">Today</span>
                      <span className="intel-severity critical">CRITICAL</span>
                    </div>
                    <h4>Critical: Grammarly Data Collection Practices</h4>
                    <p>New research reveals Grammarly's AI systems capture and analyze all typed content, including confidential business documents, potentially exposing sensitive corporate data.</p>
                    <div className="intel-actions">
                      <button className="intel-btn">Review Access</button>
                      <button className="intel-btn secondary">View Details</button>
                    </div>
                  </div>
                  <div className="intel-card high">
                    <div className="intel-header">
                      <span className="intel-date">2 days ago</span>
                      <span className="intel-severity high">HIGH</span>
                    </div>
                    <h4>High Risk: Slack Permission Escalation</h4>
                    <p>Slack has silently expanded OAuth permissions to access files across all connected workplace applications, creating potential data exposure risks without explicit user consent.</p>
                    <div className="intel-actions">
                      <button className="intel-btn">Audit Permissions</button>
                      <button className="intel-btn secondary">Review Impact</button>
                    </div>
                  </div>
                  <div className="intel-card medium">
                    <div className="intel-header">
                      <span className="intel-date">1 week ago</span>
                      <span className="intel-severity medium">MEDIUM</span>
                    </div>
                    <h4>Privacy Alert: Zoom Data Retention Changes</h4>
                    <p>Zoom has updated their data retention policies to store meeting recordings, transcripts, and participant data indefinitely, raising significant privacy and compliance concerns.</p>
                    <div className="intel-actions">
                      <button className="intel-btn">Update Policies</button>
                      <button className="intel-btn secondary">Learn More</button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="intel-section">
                <h3>📊 SaaS Security Trends</h3>
                <div className="trend-cards">
                  <div className="trend-card">
                    <h4>Shadow SaaS Growth</h4>
                    <div className="trend-stat">+23%</div>
                    <p>SMBs experienced a 23% increase in unauthorized SaaS application adoption this quarter, with employees installing business apps without IT approval.</p>
                  </div>
                  <div className="trend-card">
                    <h4>SaaS Breach Costs</h4>
                    <div className="trend-stat">$4.2M</div>
                    <p>Average total cost of SaaS-related data breaches for SMBs, including lost customer trust, regulatory fines, and business disruption.</p>
                  </div>
                  <div className="trend-card">
                    <h4>OAuth Permission Overreach</h4>
                    <div className="trend-stat">47%</div>
                    <p>Nearly half of all OAuth-connected applications request excessive permissions beyond their core functionality, creating unnecessary data exposure risks.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="policies-view">
            <h2>⚙️ SaaS Access Controls</h2>
            <p className="section-description">Control who can access your business data across all your SaaS applications</p>
            
            <div className="policies-grid">
              <div className="policy-section">
                <h3>🔐 App Permission Management</h3>
                <div className="policy-cards">
                  <div className="policy-card active">
                    <div className="policy-header">
                      <h4>🔗 Connected App Monitoring</h4>
                      <span className="policy-status active">ACTIVE</span>
                    </div>
                    <p>Track all third-party applications connected to your Google Workspace, Microsoft 365, and Slack. Get alerts when new apps request access to sensitive business data.</p>
                    <div className="policy-stats">
                      <span>✅ 23 apps being monitored</span>
                      <span>🚨 2 apps need attention</span>
                    </div>
                  </div>
                  
                  <div className="policy-card warning">
                    <div className="policy-header">
                      <h4>📧 Email & Document Access Control</h4>
                      <span className="policy-status warning">REVIEWING</span>
                    </div>
                    <p>Review which apps can read your emails, access Google Drive files, or modify documents. Remove unnecessary permissions to protect confidential business information.</p>
                    <div className="policy-stats">
                      <span>⚠️ Grammarly has email access</span>
                      <span>🔍 5 apps can read all files</span>
                    </div>
                  </div>
                  
                  <div className="policy-card active">
                    <div className="policy-header">
                      <h4>👥 User Access Governance</h4>
                      <span className="policy-status active">MANAGED</span>
                    </div>
                    <p>Ensure employees only have access to the business applications they need for their role. Automatically detect when former employees still have app access.</p>
                    <div className="policy-stats">
                      <span>✅ 15 users properly managed</span>
                      <span>📋 Access reviews up to date</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="policy-section">
                <h3>🎯 Quick Actions</h3>
                <div className="quick-actions-grid">
                  <div className="quick-action-card">
                    <div className="action-icon">🔒</div>
                    <h4>Revoke Suspicious Apps</h4>
                    <p>2 apps have excessive permissions</p>
                    <button className="action-btn primary">Review Now</button>
                  </div>
                  
                  <div className="quick-action-card">
                    <div className="action-icon">👤</div>
                    <h4>Audit User Access</h4>
                    <p>Quarterly access review is due</p>
                    <button className="action-btn">Start Review</button>
                  </div>
                  
                  <div className="quick-action-card">
                    <div className="action-icon">📱</div>
                    <h4>Enable SSO</h4>
                    <p>4 apps can use single sign-on</p>
                    <button className="action-btn">Configure</button>
                  </div>
                  
                  <div className="quick-action-card">
                    <div className="action-icon">📊</div>
                    <h4>Generate Report</h4>
                    <p>Create access control summary</p>
                    <button className="action-btn">Export PDF</button>
                  </div>
                </div>
              </div>
              
              <div className="policy-section">
                <h3>🏢 Business Application Inventory</h3>
                <div className="app-inventory">
                  <div className="inventory-header">
                    <span>All business applications with data access</span>
                    <span className="app-count">23 applications</span>
                  </div>
                  <div className="inventory-list">
                    <div className="inventory-item high-risk">
                      <div className="app-info">
                        <span className="app-icon">✏️</span>
                        <div className="app-details">
                          <h5>Grammarly</h5>
                          <p>Can read and modify all documents & emails</p>
                        </div>
                      </div>
                      <span className="risk-badge high">High Risk</span>
                      <button className="manage-btn">Manage</button>
                    </div>
                    
                    <div className="inventory-item medium-risk">
                      <div className="app-info">
                        <span className="app-icon">📅</span>
                        <div className="app-details">
                          <h5>Calendly</h5>
                          <p>Access to calendar and contact information</p>
                        </div>
                      </div>
                      <span className="risk-badge medium">Medium Risk</span>
                      <button className="manage-btn">Manage</button>
                    </div>
                    
                    <div className="inventory-item low-risk">
                      <div className="app-info">
                        <span className="app-icon">📊</span>
                        <div className="app-details">
                          <h5>Google Analytics</h5>
                          <p>Read-only access to website data</p>
                        </div>
                      </div>
                      <span className="risk-badge low">Low Risk</span>
                      <button className="manage-btn">Manage</button>
                    </div>
                    
                    <div className="inventory-more">
                      <button className="view-all-btn">View All 23 Applications →</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="knowledge-view">
            <h2>📚 Privacy & Security Knowledge Base</h2>
            <div className="knowledge-sections">
              <div className="knowledge-section">
                <h3>🔒 Security Best Practices</h3>
                <div className="knowledge-cards">
                  <div className="knowledge-card">
                    <h4>Multi-Factor Authentication (MFA)</h4>
                    <p>Enable MFA on all critical business applications. This reduces account takeover risk by 99.9%.</p>
                    <span className="knowledge-tag">High Priority</span>
                  </div>
                  <div className="knowledge-card">
                    <h4>Password Management</h4>
                    <p>Use unique, complex passwords for each application. Consider enterprise password managers like 1Password Business.</p>
                    <span className="knowledge-tag">Essential</span>
                  </div>
                  <div className="knowledge-card">
                    <h4>Regular Access Reviews</h4>
                    <p>Quarterly review of who has access to what applications. Remove access for departed employees immediately.</p>
                    <span className="knowledge-tag">Compliance</span>
                  </div>
                </div>
              </div>
              
              <div className="knowledge-section">
                <h3>⚖️ Compliance Guidelines</h3>
                <div className="knowledge-cards">
                  <div className="knowledge-card">
                    <h4>GDPR Requirements</h4>
                    <p>EU users have the right to know what data you collect, how it's used, and can request deletion.</p>
                    <span className="knowledge-tag">Legal</span>
                  </div>
                  <div className="knowledge-card">
                    <h4>Data Processing Agreements</h4>
                    <p>Ensure all SaaS vendors have signed DPAs that specify how they handle your customer data.</p>
                    <span className="knowledge-tag">Contracts</span>
                  </div>
                  <div className="knowledge-card">
                    <h4>Data Breach Response</h4>
                    <p>Have a 72-hour breach notification plan. Document all incidents and remediation steps.</p>
                    <span className="knowledge-tag">Incident Response</span>
                  </div>
                </div>
              </div>

              <div className="knowledge-section">
                <h3>⚠️ Common Risk Areas</h3>
                <div className="knowledge-cards">
                  <div className="knowledge-card">
                    <h4>Shadow IT Applications</h4>
                    <p>Employees often use unapproved apps. Regular audits help discover and secure these tools.</p>
                    <span className="knowledge-tag">Risk</span>
                  </div>
                  <div className="knowledge-card">
                    <h4>Third-Party Integrations</h4>
                    <p>OAuth connections can access sensitive data. Review and revoke unused integrations regularly.</p>
                    <span className="knowledge-tag">Access Control</span>
                  </div>
                  <div className="knowledge-card">
                    <h4>Data Retention Policies</h4>
                    <p>Define how long you keep customer data and ensure vendors follow your retention requirements.</p>
                    <span className="knowledge-tag">Policy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Threat Levels Guide Tab */}
        {activeTab === 'threat-info' && (
          <div className="threat-info-content">
            <div className="threat-info-header">
              <h2>🛡️ Understanding Threat Levels</h2>
              <p>Learn how we calculate your organization's threat level and how to improve it</p>
            </div>

            <div className="threat-levels-grid">
              <div className="threat-level-card critical">
                <div className="threat-level-icon">
                  <div className="score-circle" style={{ borderColor: '#dc2626' }}>
                    <span className="score-grade">F</span>
                  </div>
                </div>
                <div className="threat-level-info">
                  <h3>Critical Risk</h3>
                  <p>Multiple high-severity vulnerabilities detected. Immediate action required.</p>
                  <ul>
                    <li>Active security breaches or exposures</li>
                    <li>Critical vulnerabilities in key systems</li>
                    <li>Non-compliant data handling practices</li>
                    <li>Weak or compromised authentication</li>
                  </ul>
                </div>
              </div>

              <div className="threat-level-card high">
                <div className="threat-level-icon">
                  <div className="score-circle" style={{ borderColor: '#f97316' }}>
                    <span className="score-grade">D</span>
                  </div>
                </div>
                <div className="threat-level-info">
                  <h3>High Risk</h3>
                  <p>Significant security concerns that need prompt attention.</p>
                  <ul>
                    <li>High-risk application permissions</li>
                    <li>Outdated security configurations</li>
                    <li>Missing multi-factor authentication</li>
                    <li>Suspicious access patterns detected</li>
                  </ul>
                </div>
              </div>

              <div className="threat-level-card medium">
                <div className="threat-level-icon">
                  <div className="score-circle" style={{ borderColor: '#f59e0b' }}>
                    <span className="score-grade">C</span>
                  </div>
                </div>
                <div className="threat-level-info">
                  <h3>Medium Risk</h3>
                  <p>Some security issues that should be addressed to improve your posture.</p>
                  <ul>
                    <li>Moderate application permissions</li>
                    <li>Some security best practices not followed</li>
                    <li>Third-party integrations with broad access</li>
                    <li>Inconsistent access controls</li>
                  </ul>
                </div>
              </div>

              <div className="threat-level-card low">
                <div className="threat-level-icon">
                  <div className="score-circle" style={{ borderColor: '#22c55e' }}>
                    <span className="score-grade">A</span>
                  </div>
                </div>
                <div className="threat-level-info">
                  <h3>Low Risk</h3>
                  <p>Good security posture with minimal vulnerabilities.</p>
                  <ul>
                    <li>Strong authentication practices</li>
                    <li>Regular security monitoring</li>
                    <li>Minimal application permissions</li>
                    <li>Compliance with security frameworks</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="improvement-section">
              <h3>🎯 How to Improve Your Threat Level</h3>
              <div className="improvement-steps">
                <div className="improvement-step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <h4>Review App Permissions</h4>
                    <p>Regularly audit and revoke unnecessary permissions for connected applications.</p>
                  </div>
                </div>
                <div className="improvement-step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <h4>Enable Multi-Factor Authentication</h4>
                    <p>Require MFA for all users, especially those with administrative access.</p>
                  </div>
                </div>
                <div className="improvement-step">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <h4>Monitor Security Alerts</h4>
                    <p>Set up automated monitoring and respond quickly to security incidents.</p>
                  </div>
                </div>
                <div className="improvement-step">
                  <span className="step-number">4</span>
                  <div className="step-content">
                    <h4>Implement Access Controls</h4>
                    <p>Use role-based access control and principle of least privilege.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="threat-calculation">
              <h3>📊 How We Calculate Your Score</h3>
              <div className="calculation-factors">
                <div className="factor">
                  <span className="factor-weight">40%</span>
                  <div className="factor-details">
                    <h4>Application Permissions</h4>
                    <p>Risk level of connected apps and their data access</p>
                  </div>
                </div>
                <div className="factor">
                  <span className="factor-weight">25%</span>
                  <div className="factor-details">
                    <h4>Authentication Security</h4>
                    <p>MFA adoption, password policies, and account security</p>
                  </div>
                </div>
                <div className="factor">
                  <span className="factor-weight">20%</span>
                  <div className="factor-details">
                    <h4>Data Exposure</h4>
                    <p>Public data leaks and previous security incidents</p>
                  </div>
                </div>
                <div className="factor">
                  <span className="factor-weight">15%</span>
                  <div className="factor-details">
                    <h4>Compliance Status</h4>
                    <p>Adherence to security frameworks and regulations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
