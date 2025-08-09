// Authentication utilities and JWT handling for Cloudyx Security Dashboard
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'cloudyx_jwt_secret_32_chars_minimum_dev_2024_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'owner' | 'admin' | 'security_admin' | 'member' | 'viewer';
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
}

export interface JWTPayload extends AuthUser {
  iat: number;
  exp: number;
}

export class AuthService {
  // Hash password using bcrypt
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password against hash
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  static generateToken(user: AuthUser): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organizationName,
      organizationSlug: user.organizationSlug
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'cloudyx-security',
      audience: 'cloudyx-dashboard'
    });
  }

  // Verify and decode JWT token
  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'cloudyx-security',
        audience: 'cloudyx-dashboard'
      }) as JWTPayload;
      
      return decoded;
    } catch (error) {
      console.warn('[Auth] Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  // Extract token from Authorization header
  static extractToken(authHeader?: string): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  // Validate password strength
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.toLowerCase());
  }

  // Generate organization slug from name
  static generateOrgSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50); // Limit length
  }

  // Check if user has required role
  static hasRole(user: AuthUser, requiredRole: AuthUser['role']): boolean {
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
  }

  // Check if user can access organization
  static canAccessOrganization(user: AuthUser, organizationId: string): boolean {
    return user.organizationId === organizationId;
  }

  // Generate secure random token (for password resets, email verification)
  static generateSecureToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Parse display name from first/last name
  static getDisplayName(user: Partial<AuthUser>): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    if (user.lastName) {
      return user.lastName;
    }
    return user.email?.split('@')[0] || 'User';
  }
}

// Middleware function for API routes
export function requireAuth(handler: (req: any, res: any, user: AuthUser) => Promise<any>) {
  return async (req: any, res: any) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Extract and verify token
    const token = AuthService.extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'MISSING_TOKEN'
      });
    }

    const user = AuthService.verifyToken(token);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Call the actual handler with authenticated user
    try {
      return await handler(req, res, user);
    } catch (error) {
      console.error('[Auth] Handler error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'HANDLER_ERROR'
      });
    }
  };
}

// Middleware function for organization-specific routes
export function requireOrgAccess(handler: (req: any, res: any, user: AuthUser) => Promise<any>) {
  return requireAuth(async (req: any, res: any, user: AuthUser) => {
    const { orgId } = req.query;
    
    if (!orgId) {
      return res.status(400).json({
        error: 'Organization ID required',
        code: 'MISSING_ORG_ID'
      });
    }

    if (!AuthService.canAccessOrganization(user, orgId as string)) {
      return res.status(403).json({
        error: 'Access denied to organization',
        code: 'ORG_ACCESS_DENIED'
      });
    }

    return await handler(req, res, user);
  });
}

export default AuthService;