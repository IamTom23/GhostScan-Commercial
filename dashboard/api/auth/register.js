// User registration API endpoint
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'cloudyx_jwt_secret_32_chars_minimum_dev_2024_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Authentication utilities
class AuthService {
  // Generate JWT token
  static generateToken(user) {
    const payload = {
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

  // Validate email format
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.toLowerCase());
  }

  // Generate organization slug from name
  static generateOrgSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50); // Limit length
  }

  // Validate password strength
  static validatePassword(password) {
    const errors = [];

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

// In-memory storage for demo mode (resets on server restart)
const demoUsers = [];
let userIdCounter = 1;
let orgIdCounter = 1;

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      organizationName,
      organizationType = 'smb',
      industry,
      employees 
    } = req.body;

    // Validate required fields
    if (!email || !password || !organizationName) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'MISSING_FIELDS',
        details: {
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null,
          organizationName: !organizationName ? 'Organization name is required' : null
        }
      });
    }

    // Validate email format
    if (!AuthService.validateEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Validate password strength (relaxed for demo)
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long',
        code: 'WEAK_PASSWORD'
      });
    }

    // Check if user already exists (including predefined demo users)
    const existingDemoEmails = ['demo@techflowstartup.com', 'admin@growthcorp.com'];
    const existingUser = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) ||
                        existingDemoEmails.includes(email.toLowerCase());
    
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        code: 'USER_EXISTS'
      });
    }

    // Generate organization slug
    const orgSlug = AuthService.generateOrgSlug(organizationName);
    const orgId = `org_demo_${orgIdCounter++}`;
    const userId = `user_demo_${userIdCounter++}`;

    // Create new user in demo storage
    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      firstName: firstName || '',
      lastName: lastName || '',
      role: 'owner',
      organizationId: orgId,
      organizationName,
      organizationSlug: orgSlug,
      organizationType,
      industry,
      employees,
      createdAt: new Date().toISOString()
    };

    // Add to demo storage
    demoUsers.push(newUser);

    // Generate JWT token
    const token = AuthService.generateToken(newUser);

    console.log(`[Auth] New demo user registered: ${email} for organization: ${organizationName}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful (demo mode)',
      user: {
        ...newUser,
        displayName: AuthService.getDisplayName(newUser)
      },
      token,
      organization: {
        id: orgId,
        name: organizationName,
        slug: orgSlug,
        type: organizationType
      },
      demoMode: true
    });

  } catch (error) {
    console.error('[Auth] Registration error:', error);
    
    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR',
      details: error.message
    });
  }
}