// Cloudyx Logo Component
import React from 'react';

interface CloudyxLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  variant?: 'default' | 'header' | 'auth';
  className?: string;
}

export const CloudyxLogo: React.FC<CloudyxLogoProps> = ({ 
  size = 'medium', 
  showText = true, 
  variant = 'default',
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return { 
          icon: { width: '24px', height: '24px' }, 
          text: { fontSize: '1.125rem' } 
        };
      case 'large':
        return { 
          icon: { width: '56px', height: '56px' }, 
          text: { fontSize: '2.25rem' } 
        };
      default:
        return { 
          icon: { width: '40px', height: '40px' }, 
          text: { fontSize: '1.5rem' } 
        };
    }
  };

  const getVariantStyles = () => {
    const baseStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem' };
    switch (variant) {
      case 'header':
        return baseStyle;
      case 'auth':
        return { ...baseStyle, flexDirection: 'column' as const };
      default:
        return baseStyle;
    }
  };

  const sizes = getSizeClasses();
  const variantStyles = getVariantStyles();

  return (
    <div style={variantStyles} className={className}>
      {/* Cloudyx Icon - Modern cloud with security shield */}
      <div style={{ 
        ...sizes.icon, 
        position: 'relative', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Cloud base */}
          <path
            d="M38 20C38 12.2688 32.0792 6 25 6C19.7688 6 15.2252 9.47 13.3 14.2C9.36 14.8 6 18.16 6 22.2C6 26.624 9.576 30.2 14 30.2H37C40.866 30.2 44 27.066 44 23.2C44 19.734 41.332 16.888 38 16.2V20Z"
            fill="url(#cloudGradient)"
            stroke="url(#cloudStroke)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Security shield overlay */}
          <path
            d="M24 12L28.5 14.5V20C28.5 23.5 26.5 26.5 24 27.5C21.5 26.5 19.5 23.5 19.5 20V14.5L24 12Z"
            fill="url(#shieldGradient)"
            stroke="var(--primary-color)"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Security checkmark */}
          <path
            d="M21.5 19L23 20.5L26.5 17"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="cloudGradient" x1="6" y1="6" x2="44" y2="30.2" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="var(--secondary-color)" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="cloudStroke" x1="6" y1="6" x2="44" y2="30.2" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--secondary-color)" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="shieldGradient" x1="19.5" y1="12" x2="28.5" y2="27.5" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="var(--primary-color)" />
              <stop offset="100%" stopColor="var(--secondary-color)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Cloudyx Text */}
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{
            ...sizes.text,
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.025em',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            margin: 0,
            fontWeight: 'bold',
            lineHeight: 1.2
          }}>
            Cloudyx
          </h1>
          {variant === 'auth' && (
            <span style={{
              color: 'var(--secondary-color)',
              letterSpacing: '1.4px',
              marginTop: '0.375rem',
              opacity: 0.9,
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: '0.75rem',
              textAlign: 'center',
              fontWeight: 500,
              textTransform: 'uppercase'
            }}>
              AI-Powered SaaS Security Management
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Simple icon-only version for use in tight spaces
export const CloudyxIcon: React.FC<{ size?: string; className?: string }> = ({ 
  size = 'w-6 h-6', 
  className = '' 
}) => {
  return (
    <div className={`${size} relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <path
          d="M38 20C38 12.2688 32.0792 6 25 6C19.7688 6 15.2252 9.47 13.3 14.2C9.36 14.8 6 18.16 6 22.2C6 26.624 9.576 30.2 14 30.2H37C40.866 30.2 44 27.066 44 23.2C44 19.734 41.332 16.888 38 16.2V20Z"
          fill="url(#cloudGradient2)"
          stroke="url(#cloudStroke2)"
          strokeWidth="1.5"
        />
        <path
          d="M24 12L28.5 14.5V20C28.5 23.5 26.5 26.5 24 27.5C21.5 26.5 19.5 23.5 19.5 20V14.5L24 12Z"
          fill="url(#shieldGradient2)"
          stroke="var(--primary-color)"
          strokeWidth="1"
        />
        <path
          d="M21.5 19L23 20.5L26.5 17"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="cloudGradient2" x1="6" y1="6" x2="44" y2="30.2" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="var(--secondary-color)" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="cloudStroke2" x1="6" y1="6" x2="44" y2="30.2" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--secondary-color)" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="shieldGradient2" x1="19.5" y1="12" x2="28.5" y2="27.5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--primary-color)" />
            <stop offset="100%" stopColor="var(--secondary-color)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default CloudyxLogo;