import jwt from 'jsonwebtoken';
import express from 'express';
import { supabaseUserDAO } from '../lib/supabase';
import { OAuthUser } from '../config/oauth';

// Extended Request type to include user  
export interface AuthenticatedRequest extends Omit<express.Request, 'user'> {
  user?: OAuthUser;
  jwtPayload?: any;
}

// JWT verification middleware
export const authenticateJWT = async (
  req: express.Request, 
  res: express.Response, 
  next: express.NextFunction
) => {
  try {
    // Get token from Authorization header or query parameter
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : req.query.token as string;

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid JWT token in Authorization header or token query parameter'
      });
    }

    // Verify JWT token
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret) as any;
    
    // Validate that user still exists in database
    const user = await supabaseUserDAO.findByEmail(decoded.email);
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'The user associated with this token no longer exists'
      });
    }

    // Attach user to request
    (req as any).user = {
      id: user.id,
      email: user.email,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      provider: decoded.provider,
      accessToken: '', // OAuth tokens not included in JWT
      organizationId: user.organization_id,
      role: user.role
    };
    
    (req as any).jwtPayload = decoded;
    next();

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid.'
      });
    }

    console.error('JWT authentication error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      message: 'Unable to authenticate request'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: express.Request, 
  res: express.Response, 
  next: express.NextFunction
) => {
  try {
    // Get token from Authorization header or query parameter
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : req.query.token as string;

    if (!token) {
      return next(); // No token, continue without auth
    }

    // Try to verify token, but don't fail if invalid
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret) as any;
    
    // Try to get user from database
    const user = await supabaseUserDAO.findByEmail(decoded.email);
    if (user) {
      (req as any).user = {
        id: user.id,
        email: user.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        provider: decoded.provider,
        accessToken: '',
        organizationId: user.organization_id,
        role: user.role
      };
      (req as any).jwtPayload = decoded;
    }

    next();
  } catch (error) {
    // Silent fail for optional auth
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (...roles: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user as OAuthUser;
    if (!user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    if (!roles.includes(user.role || '')) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This action requires one of the following roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Organization access middleware
export const requireOrganizationAccess = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user as OAuthUser;
  if (!user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'You must be logged in to access organization data'
    });
  }

  const requestedOrgId = req.params.organizationId || req.params.orgId;
  
  if (!requestedOrgId) {
    return res.status(400).json({ 
      error: 'Organization ID required',
      message: 'Organization ID must be provided in the request'
    });
  }

  if (user.organizationId !== requestedOrgId) {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'You can only access data for your own organization'
    });
  }

  next();
};