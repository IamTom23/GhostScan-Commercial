// Authentication Context for Cloudyx Security Dashboard
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  role: 'owner' | 'admin' | 'security_admin' | 'member' | 'viewer';
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'startup' | 'smb' | 'enterprise';
}

interface AuthContextType {
  user: AuthUser | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  demoMode: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (role: AuthUser['role']) => boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  organizationType?: 'startup' | 'smb' | 'enterprise';
  industry?: string;
  employees?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'cloudyx_auth_token';
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  const isAuthenticated = !!user;

  // Load user from stored token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Verify token by making an authenticated request
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setOrganization(data.organization);
          setDemoMode(data.demoMode || false);
        } else {
          // Token is invalid, remove it
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch (error) {
        console.error('[Auth] Failed to verify token:', error);
        localStorage.removeItem(TOKEN_KEY);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setUser(data.user);
        setOrganization(data.organization);
        setDemoMode(data.demoMode || false);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.error || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection.' 
      };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        localStorage.setItem(TOKEN_KEY, result.token);
        setUser(result.user);
        setOrganization(result.organization);
        setDemoMode(result.demoMode || false);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.error || 'Registration failed' 
        };
      }
    } catch (error) {
      console.error('[Auth] Registration error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setOrganization(null);
    setDemoMode(false);
  };

  const hasRole = (requiredRole: AuthUser['role']): boolean => {
    if (!user) return false;

    const roleHierarchy: Record<AuthUser['role'], number> = {
      viewer: 1,
      member: 2,
      security_admin: 3,
      admin: 4,
      owner: 5
    };

    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  };

  const value: AuthContextType = {
    user,
    organization,
    isAuthenticated,
    isLoading,
    demoMode,
    login,
    register,
    logout,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <LoginPage />;
    }

    return <Component {...props} />;
  };
}

// Import LoginPage (we'll create this next)
const LoginPage = () => <div>Login component will be created next...</div>;

export default AuthContext;