// User login API endpoint
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

  // Verify password against hash (simplified for demo)
  static async verifyPassword(password, hashedPassword) {
    // For demo mode, accept any password
    if (hashedPassword === '$2b$12$demo.hash.for.testing.purposes.only') {
      return true;
    }
    return bcrypt.compare(password, hashedPassword);
  }
}

// Demo users for testing when database is disabled
const getDemoUsers = () => [
  {
    id: 'user_demo_owner',
    email: 'demo@techflowstartup.com',
    password_hash: '$2b$12$demo.hash.for.testing.purposes.only',
    first_name: 'Demo',
    last_name: 'User',
    role: 'owner',
    organization_id: 'org_demo_startup',
    organization_name: 'TechFlow Startup',
    organization_slug: 'techflow-startup'
  },
  {
    id: 'user_demo_admin',
    email: 'admin@growthcorp.com',
    password_hash: '$2b$12$demo.hash.for.testing.purposes.only',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    organization_id: 'org_demo_smb',
    organization_name: 'GrowthCorp SMB',
    organization_slug: 'growthcorp-smb'
  }
];

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
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Validate email format
    if (!AuthService.validateEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Use demo authentication (since database is not enabled in demo)
    const demoUsers = getDemoUsers();
    const demoUser = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!demoUser) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        hint: 'Demo emails: demo@techflowstartup.com, admin@growthcorp.com'
      });
    }

    // Verify password
    const isValidPassword = await AuthService.verifyPassword(password, demoUser.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const authUser = {
      id: demoUser.id,
      email: demoUser.email,
      firstName: demoUser.first_name,
      lastName: demoUser.last_name,
      role: demoUser.role,
      organizationId: demoUser.organization_id,
      organizationName: demoUser.organization_name,
      organizationSlug: demoUser.organization_slug
    };

    const token = AuthService.generateToken(authUser);

    return res.status(200).json({
      success: true,
      message: 'Login successful (demo mode)',
      user: {
        ...authUser,
        displayName: AuthService.getDisplayName(authUser)
      },
      token,
      organization: {
        id: authUser.organizationId,
        name: authUser.organizationName,
        slug: authUser.organizationSlug
      },
      demoMode: true
    });

  } catch (error) {
    console.error('[Auth] Login error:', error);
    
    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_ERROR',
      details: error.message
    });
  }
}