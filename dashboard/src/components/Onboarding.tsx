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
              <h1>Get Your Security Assessment</h1>
              <p>Discover vulnerabilities and compliance gaps in your digital infrastructure in under 60 seconds</p>
            </div>
            
            <div className="provider-selection">
              <h3>What Would You Like to Secure?</h3>
              <div className="provider-buttons">
                <button 
                  className="provider-btn saas"
                  onClick={() => handleProviderSelect('saas')}
                >
                  <span className="provider-icon">📱</span>
                  <span>SaaS Applications</span>
                  <span className="provider-tag">Most SMBs</span>
                </button>
                
                <button 
                  className="provider-btn aws"
                  onClick={() => handleProviderSelect('aws')}
                >
                  <span className="provider-icon">☁️</span>
                  <span>Amazon Web Services</span>
                </button>
                
                <button 
                  className="provider-btn azure"
                  onClick={() => handleProviderSelect('azure')}
                >
                  <span className="provider-icon">🔷</span>
                  <span>Microsoft Azure</span>
                </button>
                
                <button 
                  className="provider-btn gcp"
                  onClick={() => handleProviderSelect('gcp')}
                >
                  <span className="provider-icon">🌈</span>
                  <span>Google Cloud Platform</span>
                </button>
                
                <button 
                  className="provider-btn assessment"
                  onClick={() => handleProviderSelect('assessment')}
                >
                  <span className="provider-icon">📊</span>
                  <span>Security Assessment</span>
                  <span className="provider-tag">Getting Started</span>
                </button>
              </div>
            </div>
            
            <div className="trust-indicators">
              <div className="trust-item">
                <span className="trust-icon">✅</span>
                <span>Secure, read-only access</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">⚡</span>
                <span>Works with any tech stack</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🆓</span>
                <span>Free security assessment</span>
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
                {selectedProvider === 'saas' && 'Discovering SaaS Applications...'}
                {selectedProvider === 'assessment' && 'Preparing Security Assessment...'}
                {!['saas', 'assessment'].includes(selectedProvider) && `Connecting to ${selectedProvider.toUpperCase()}...`}
              </h2>
              <p>
                {selectedProvider === 'saas' && 'Scanning for connected business applications'}
                {selectedProvider === 'assessment' && 'Analyzing your security requirements'}
                {!['saas', 'assessment'].includes(selectedProvider) && 'Redirecting to secure authentication'}
              </p>
            </div>
          </div>
        )}

        {/* Scanning Step */}
        {currentStep === 'scanning' && (
          <div className="onboarding-step scanning-step">
            <div className="scan-progress">
              <h2>
                {selectedProvider === 'saas' && 'Scanning Your SaaS Applications'}
                {selectedProvider === 'assessment' && 'Performing Security Assessment'}
                {!['saas', 'assessment'].includes(selectedProvider) && 'Scanning Your Cloud Infrastructure'}
              </h2>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${scanProgress}%` }}
                ></div>
              </div>
              <p>{Math.round(scanProgress)}% Complete</p>
              
              <div className="scan-details">
                {selectedProvider === 'saas' && (
                  <>
                    <div className="scan-item">
                      <span className="scan-icon">📱</span>
                      <span>Discovering connected SaaS applications...</span>
                    </div>
                    <div className="scan-item">
                      <span className="scan-icon">🔑</span>
                      <span>Checking OAuth permissions...</span>
                    </div>
                    <div className="scan-item">
                      <span className="scan-icon">🔒</span>
                      <span>Evaluating data access controls...</span>
                    </div>
                    <div className="scan-item">
                      <span className="scan-icon">📋</span>
                      <span>Assessing compliance requirements...</span>
                    </div>
                  </>
                )}
                {selectedProvider === 'assessment' && (
                  <>
                    <div className="scan-item">
                      <span className="scan-icon">🏢</span>
                      <span>Analyzing business requirements...</span>
                    </div>
                    <div className="scan-item">
                      <span className="scan-icon">⚖️</span>
                      <span>Evaluating compliance needs...</span>
                    </div>
                    <div className="scan-item">
                      <span className="scan-icon">🎯</span>
                      <span>Identifying security priorities...</span>
                    </div>
                    <div className="scan-item">
                      <span className="scan-icon">📊</span>
                      <span>Generating recommendations...</span>
                    </div>
                  </>
                )}
                {!['saas', 'assessment'].includes(selectedProvider) && (
                  <>
                    <div className="scan-item">
                      <span className="scan-icon">🔍</span>
                      <span>Analyzing security configurations...</span>
                    </div>
                    <div className="scan-item">
                      <span className="scan-icon">🏗️</span>
                      <span>Checking infrastructure settings...</span>
                    </div>
                    <div className="scan-item">
                      <span className="scan-icon">🔒</span>
                      <span>Evaluating access controls...</span>
                    </div>
                    <div className="scan-item">
                      <span className="scan-icon">📋</span>
                      <span>Reviewing compliance status...</span>
                    </div>
                  </>
                )}
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
              <h3>Top Issues Found:</h3>
              <div className="issue-list">
                <div className="issue-item">
                  <span className="issue-severity critical">CRITICAL</span>
                  <span className="issue-title">Database exposed to internet</span>
                </div>
                <div className="issue-item">
                  <span className="issue-severity critical">CRITICAL</span>
                  <span className="issue-title">Default admin passwords detected</span>
                </div>
                <div className="issue-item">
                  <span className="issue-severity warning">MEDIUM</span>
                  <span className="issue-title">SSL certificates expiring soon</span>
                </div>
              </div>
            </div>

            <div className="results-actions">
              <button className="primary-btn" onClick={handleGetStarted}>
                View Full Report & Fix Issues
              </button>
              <p className="results-note">
                ✨ Get step-by-step fix instructions for every issue
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};