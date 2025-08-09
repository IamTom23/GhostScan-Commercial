// Login Component for Cloudyx Security Dashboard
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

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
      setEmail('admin@techflow.io');
      setPassword('password123');
    } else {
      setEmail('security@growthcorp.com');
      setPassword('password123');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <span className="logo-icon">☁️</span>
            <h1>Cloudyx</h1>
            <span className="company-tag">SaaS Security Management</span>
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to your security dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              <span>⚠️</span>
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
                {showPassword ? '👁️' : '👁️‍🗨️'}
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
          <h4>🎯 Quick Demo Access</h4>
          <p>Try Cloudyx with sample data:</p>
          <div className="demo-buttons">
            <button
              type="button"
              className="demo-button"
              onClick={() => fillDemoCredentials('startup')}
              disabled={isLoading}
            >
              <span>🚀</span>
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
              <span>🏢</span>
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
            <span>🔒</span>
            <span>Enterprise Security</span>
          </div>
          <div className="trust-item">
            <span>🛡️</span>
            <span>SOC 2 Compliant</span>
          </div>
          <div className="trust-item">
            <span>⚡</span>
            <span>99.9% Uptime</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;