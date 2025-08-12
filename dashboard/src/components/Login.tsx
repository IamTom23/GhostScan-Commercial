// Login Component for Cloudyx Security Dashboard
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';
import { CloudyxLogo } from './CloudyxLogo';

interface LoginProps {
  onSwitchToRegister?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    
    setIsLoading(false);
  };

  const fillDemoCredentials = (type: 'startup' | 'smb') => {
    if (type === 'startup') {
      setEmail('demo@techflowstartup.com');
      setPassword('demo123');
    } else {
      setEmail('admin@growthcorp.com');
      setPassword('admin123');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <CloudyxLogo size="large" variant="auth" />
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to your security dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56991 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 12S7 5 12 5S22 12 22 12S17 19 12 19S2 12 2 12Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.88 9.88C10.22 9.54 10.66 9.33 11.14 9.33C12.08 9.33 12.83 10.08 12.83 11.02C12.83 11.5 12.62 11.94 12.28 12.28M15 12C15 12.93 14.93 13.85 14.79 14.75C14.08 13.93 13.07 13.4 11.93 13.4C10.79 13.4 9.78 13.93 9.07 14.75C8.93 13.85 8.86 12.93 8.86 12C8.86 11.07 8.93 10.15 9.07 9.25C9.78 10.07 10.79 10.6 11.93 10.6C13.07 10.6 14.08 10.07 14.79 9.25C14.93 10.15 15 11.07 15 12ZM2.01 3L20 21M6.12 6.12C4.24 7.39 2.66 9.22 1.87 11.22C1.83 11.39 1.83 11.61 1.87 11.78C3.26 16.31 7.28 19.62 12 19.62C13.54 19.62 15.02 19.29 16.36 18.7L6.12 6.12Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-button primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo Mode Helper */}
        <div className="demo-helper">
          <h4>Quick Demo Access</h4>
          <p>Try Cloudyx with sample data:</p>
          <div className="demo-buttons">
            <button
              type="button"
              className="demo-button"
              onClick={() => fillDemoCredentials('startup')}
              disabled={isLoading}
            >
              <div className="demo-icon startup">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <strong>Startup Demo</strong>
                <small>TechFlow - 12 employees</small>
              </div>
            </button>
            <button
              type="button"
              className="demo-button"
              onClick={() => fillDemoCredentials('smb')}
              disabled={isLoading}
            >
              <div className="demo-icon enterprise">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 21H21V8L12 2L3 8V21Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M9 21V12H15V21" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M9 9H10M14 9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <strong>SMB Demo</strong>
                <small>GrowthCorp - 45 employees</small>
              </div>
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <div className="auth-links">
            <button type="button" className="link-button">
              Forgot Password?
            </button>
            <span className="separator">•</span>
            <button 
              type="button" 
              className="link-button"
              onClick={onSwitchToRegister}
            >
              Create Account
            </button>
          </div>
        </div>

        <div className="trust-indicators">
          <div className="trust-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
            <span>Enterprise Security</span>
          </div>
          <div className="trust-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>SOC 2 Compliant</span>
          </div>
          <div className="trust-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>99.9% Uptime</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;