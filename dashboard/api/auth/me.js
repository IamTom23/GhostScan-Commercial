// User profile API endpoint - verifies JWT and returns user info
import jwt from 'jsonwebtoken';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'cloudyx_jwt_secret_32_chars_minimum_dev_2024_secure';

// Authentication utilities
class AuthService {
  // Verify and decode JWT token
  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'cloudyx-security',
        audience: 'cloudyx-dashboard'
      });
      
      return decoded;
    } catch (error) {
      console.warn('[Auth] Token verification failed:', error.message);
      return null;
    }
  }

  // Extract token from Authorization header
  static extractToken(authHeader) {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  // Parse display name
  static getDisplayName(user) {
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

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    // Return user information
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: AuthService.getDisplayName(user),
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organizationName,
        organizationSlug: user.organizationSlug
      },
      organization: {
        id: user.organizationId,
        name: user.organizationName,
        slug: user.organizationSlug
      },
      demoMode: true
    });

  } catch (error) {
    console.error('[Auth] Me API error:', error);
    
    res.status(500).json({
      error: 'Authentication failed',
      code: 'AUTH_ERROR',
      details: error.message
    });
  }
}