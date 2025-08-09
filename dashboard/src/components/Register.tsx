// Register Component for Cloudyx Security Dashboard
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

interface RegisterProps {
  onSwitchToLogin?: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    organizationName: '',
    organizationType: 'smb' as 'startup' | 'smb' | 'enterprise',
    industry: '',
    employees: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string[] }>({ score: 0, feedback: [] });

  const { register } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Check password strength in real-time
    if (name === 'password') {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const checkPasswordStrength = (password: string) => {
    const feedback = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push('At least 8 characters');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('One uppercase letter');

    if (/[a-z]/.test(password)) score++;
    else feedback.push('One lowercase letter');

    if (/[0-9]/.test(password)) score++;
    else feedback.push('One number');

    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push('One special character');

    return { score, feedback };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength.score < 5) {
      setError('Password does not meet security requirements');
      return;
    }

    setIsLoading(true);

    const result = await register({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      organizationName: formData.organizationName,
      organizationType: formData.organizationType,
      industry: formData.industry,
      employees: formData.employees ? parseInt(formData.employees) : undefined
    });
    
    if (!result.success) {
      setError(result.error || 'Registration failed');
    }
    
    setIsLoading(false);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return '#ef4444'; // Red
    if (passwordStrength.score <= 3) return '#f59e0b'; // Orange
    if (passwordStrength.score <= 4) return '#3b82f6'; // Blue
    return '#10b981'; // Green
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score <= 3) return 'Fair';
    if (passwordStrength.score <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <div className="auth-header">
          <div className="logo">
            <span className="logo-icon">☁️</span>
            <h1>Cloudyx</h1>
            <span className="company-tag">SaaS Security Management</span>
          </div>
          <h2>Start Securing Your Business</h2>
          <p>Create your account and get insights in under 60 seconds</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="John"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Doe"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Work Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="john@company.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="organizationName">Company Name</label>
            <input
              id="organizationName"
              name="organizationName"
              type="text"
              value={formData.organizationName}
              onChange={handleInputChange}
              placeholder="Your Company Ltd"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="organizationType">Company Type</label>
              <select
                id="organizationType"
                name="organizationType"
                value={formData.organizationType}
                onChange={handleInputChange}
                disabled={isLoading}
              >
                <option value="startup">Startup (1-20 employees)</option>
                <option value="smb">SMB (21-500 employees)</option>
                <option value="enterprise">Enterprise (500+ employees)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="employees">Team Size</label>
              <input
                id="employees"
                name="employees"
                type="number"
                value={formData.employees}
                onChange={handleInputChange}
                placeholder="25"
                min="1"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="industry">Industry (Optional)</label>
            <input
              id="industry"
              name="industry"
              type="text"
              value={formData.industry}
              onChange={handleInputChange}
              placeholder="Technology, Healthcare, Finance..."
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a strong password"
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
            {formData.password && (
              <div className="password-strength">
                <div 
                  className="strength-bar"
                  style={{ 
                    width: `${(passwordStrength.score / 5) * 100}%`,
                    backgroundColor: getPasswordStrengthColor()
                  }}
                ></div>
                <div className="strength-info">
                  <span style={{ color: getPasswordStrengthColor() }}>
                    {getPasswordStrengthLabel()}
                  </span>
                  {passwordStrength.feedback.length > 0 && (
                    <small>Missing: {passwordStrength.feedback.join(', ')}</small>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="auth-button primary"
            disabled={isLoading || passwordStrength.score < 5}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Creating Account...
              </>
            ) : (
              'Create Account & Start Scan'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <div className="auth-links">
            <span>Already have an account?</span>
            <button 
              type="button" 
              className="link-button"
              onClick={onSwitchToLogin}
            >
              Sign In
            </button>
          </div>
        </div>

        <div className="signup-benefits">
          <h4>🚀 What you get:</h4>
          <ul>
            <li>✅ Complete SaaS security scan in under 60 seconds</li>
            <li>✅ Real-time breach alerts for your applications</li>
            <li>✅ GDPR, SOX, and ISO 27001 compliance tracking</li>
            <li>✅ Actionable security recommendations</li>
            <li>✅ 14-day free trial, no credit card required</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Register;