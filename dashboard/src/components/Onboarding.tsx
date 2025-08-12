import React, { useState } from 'react';
import './Onboarding.css';

interface OnboardingProps {
  onComplete: () => void;
}

type OnboardingStep = 'welcome' | 'connect' | 'scanning' | 'results';

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [scanProgress, setScanProgress] = useState(0);

  const handleProviderSelect = (provider: string) => {
    setSelectedProvider(provider);
    setCurrentStep('connect');
    
    // Simulate OAuth flow
    setTimeout(() => {
      setCurrentStep('scanning');
      startScan();
    }, 1500);
  };

  const startScan = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      setScanProgress(Math.min(progress, 100));
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setCurrentStep('results');
        }, 500);
      }
    }, 300);
  };

  const handleGetStarted = () => {
    onComplete();
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        
        {/* Welcome Step */}
        {currentStep === 'welcome' && (
          <div className="onboarding-step welcome-step">
            <div className="onboarding-header">
              <h1>Secure Your Business Applications</h1>
              <p>Discover which apps can access your business data and control permissions in under 60 seconds</p>
            </div>
            
            <div className="provider-selection">
              <h3>Connect Your Business Applications</h3>
              <div className="provider-buttons">
                <button 
                  className="provider-btn google"
                  onClick={() => handleProviderSelect('google')}
                >
                  <div className="provider-icon email">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>Google Workspace</span>
                  <span className="provider-tag">Most Popular</span>
                </button>
                
                <button 
                  className="provider-btn microsoft"
                  onClick={() => handleProviderSelect('microsoft')}
                >
                  <div className="provider-icon enterprise">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 21H21V8L12 2L3 8V21Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <path d="M9 21V12H15V21" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <path d="M9 9H10M14 9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span>Microsoft 365</span>
                </button>
                
                <button 
                  className="provider-btn slack"
                  onClick={() => handleProviderSelect('slack')}
                >
                  <div className="provider-icon chat">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>Slack Workspace</span>
                </button>
                
                <button 
                  className="provider-btn discover"
                  onClick={() => handleProviderSelect('discover')}
                >
                  <div className="provider-icon search">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                      <path d="21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>Discover All Apps</span>
                  <span className="provider-tag">Recommended</span>
                </button>
              </div>
            </div>
            
            <div className="trust-indicators">
              <div className="trust-item">
                <svg className="trust-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
                <span>Read-only permissions</span>
              </div>
              <div className="trust-item">
                <svg className="trust-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>No software to install</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🆓</span>
                <span>Free security audit</span>
              </div>
            </div>
          </div>
        )}

        {/* Connect Step */}
        {currentStep === 'connect' && (
          <div className="onboarding-step connect-step">
            <div className="connect-animation">
              <div className="connect-spinner"></div>
              <h2>
                {selectedProvider === 'google' && 'Connecting to Google Workspace...'}
                {selectedProvider === 'microsoft' && 'Connecting to Microsoft 365...'}
                {selectedProvider === 'slack' && 'Connecting to Slack...'}
                {selectedProvider === 'discover' && 'Scanning for Business Applications...'}
              </h2>
              <p>
                {['google', 'microsoft', 'slack'].includes(selectedProvider) && 'Redirecting to secure OAuth authentication'}
                {selectedProvider === 'discover' && 'Analyzing your domain for connected applications'}
              </p>
            </div>
          </div>
        )}

        {/* Scanning Step */}
        {currentStep === 'scanning' && (
          <div className="onboarding-step scanning-step">
            <div className="scan-progress">
              <h2>Analyzing Your Business Applications</h2>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${scanProgress}%` }}
                ></div>
              </div>
              <p>{Math.round(scanProgress)}% Complete</p>
              
              <div className="scan-details">
                <div className="scan-item">
                  <div className="scan-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                      <path d="21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>Discovering connected applications...</span>
                </div>
                <div className="scan-item">
                  <div className="scan-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 10V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="5" y="10" width="14" height="10" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <span>Analyzing OAuth permissions...</span>
                </div>
                <div className="scan-item">
                  <div className="scan-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M23 21V19C23 18.1645 22.7155 17.3541 22.2094 16.6977C21.7033 16.0413 20.9997 15.5735 20.2 15.3667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 3.36667C16.7993 3.57397 17.5029 4.04165 18.009 4.69805C18.5151 5.35445 18.7996 6.16491 18.7996 7.00001C18.7996 7.83511 18.5151 8.64557 18.009 9.30197C17.5029 9.95837 16.7993 10.426 16 10.6333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>Checking user access rights...</span>
                </div>
                <div className="scan-item">
                  <div className="scan-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 3V21H21V3H3ZM7 17H5V10H7V17ZM13 17H11V7H13V17ZM19 17H17V13H19V17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>Assessing data exposure risks...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Step */}
        {currentStep === 'results' && (
          <div className="onboarding-step results-step">
            <div className="results-header">
              <div className="security-grade">
                <div className="grade-circle grade-c">
                  <span className="grade-letter">C-</span>
                </div>
                <div className="grade-info">
                  <h2>Your Security Grade</h2>
                  <p>Room for improvement detected</p>
                </div>
              </div>
            </div>

            <div className="results-summary">
              <div className="result-item critical">
                <div className="result-count">3</div>
                <div className="result-label">
                  <span>Critical Issues</span>
                  <small>Require immediate attention</small>
                </div>
              </div>
              
              <div className="result-item warning">
                <div className="result-count">12</div>
                <div className="result-label">
                  <span>Medium Risks</span>
                  <small>Should be addressed soon</small>
                </div>
              </div>
              
              <div className="result-item success">
                <div className="result-count">15</div>
                <div className="result-label">
                  <span>Best Practices</span>
                  <small>You're doing great!</small>
                </div>
              </div>
            </div>

            <div className="results-preview">
              <h3>Top Security Issues Found:</h3>
              <div className="issue-list">
                <div className="issue-item">
                  <span className="issue-severity critical">CRITICAL</span>
                  <span className="issue-title">Grammarly has access to all documents</span>
                </div>
                <div className="issue-item">
                  <span className="issue-severity critical">CRITICAL</span>
                  <span className="issue-title">External app can read private emails</span>
                </div>
                <div className="issue-item">
                  <span className="issue-severity warning">MEDIUM</span>
                  <span className="issue-title">Slack workspace not using SSO</span>
                </div>
              </div>
            </div>

            <div className="results-actions">
              <button className="primary-btn" onClick={handleGetStarted}>
                Secure Your Apps & Control Access
              </button>
              <p className="results-note">
Get step-by-step instructions to control app permissions
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};