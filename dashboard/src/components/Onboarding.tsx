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
                  <span className="provider-icon">📧</span>
                  <span>Google Workspace</span>
                  <span className="provider-tag">Most Popular</span>
                </button>
                
                <button 
                  className="provider-btn microsoft"
                  onClick={() => handleProviderSelect('microsoft')}
                >
                  <span className="provider-icon">💼</span>
                  <span>Microsoft 365</span>
                </button>
                
                <button 
                  className="provider-btn slack"
                  onClick={() => handleProviderSelect('slack')}
                >
                  <span className="provider-icon">💬</span>
                  <span>Slack Workspace</span>
                </button>
                
                <button 
                  className="provider-btn discover"
                  onClick={() => handleProviderSelect('discover')}
                >
                  <span className="provider-icon">🔍</span>
                  <span>Discover All Apps</span>
                  <span className="provider-tag">Recommended</span>
                </button>
              </div>
            </div>
            
            <div className="trust-indicators">
              <div className="trust-item">
                <span className="trust-icon">🔒</span>
                <span>Read-only permissions</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">⚡</span>
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
                  <span className="scan-icon">🔍</span>
                  <span>Discovering connected applications...</span>
                </div>
                <div className="scan-item">
                  <span className="scan-icon">🔑</span>
                  <span>Analyzing OAuth permissions...</span>
                </div>
                <div className="scan-item">
                  <span className="scan-icon">👥</span>
                  <span>Checking user access rights...</span>
                </div>
                <div className="scan-item">
                  <span className="scan-icon">📊</span>
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
                🔒 Get step-by-step instructions to control app permissions
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};