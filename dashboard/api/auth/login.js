// User login API endpoint
// Authenticates user and returns JWT token

// Database connection (optional)
let database, userDAO;
const isDatabaseEnabled = process.env.ENABLE_DATABASE === 'true';

async function initializeDatabase() {
  if (!isDatabaseEnabled) {
    return;
  }

  try {
    const dbModule = await import('../../lib/database.ts');
    database = dbModule.default;
    userDAO = dbModule.userDAO;
    console.log('[Auth] Database modules loaded successfully');
  } catch (error) {
    console.warn('[Auth] Database modules failed to load:', error.message);
  }
}

// Import auth utilities
let AuthService;
async function initializeAuth() {
  try {
    const authModule = await import('../../lib/auth.ts');
    AuthService = authModule.AuthService;
  } catch (error) {
    console.error('[Auth] Failed to load auth utilities:', error.message);
    throw new Error('Authentication system not available');
  }
}

// Demo users for testing when database is disabled
const getDemoUsers = () => [
  {
    id: 'user_demo_owner',
    email: 'admin@techflow.io',
    password_hash: '$2b$12$demo.hash.for.testing.purposes.only', // This would be "password123"
    first_name: 'John',
    last_name: 'Doe',
    role: 'owner',
    organization_id: 'org_demo_startup',
    organization_name: 'TechFlow Startup',
    organization_slug: 'techflow-startup'
  },
  {
    id: 'user_demo_admin',
    email: 'security@growthcorp.com',
    password_hash: '$2b$12$demo.hash.for.testing.purposes.only',
    first_name: 'Jane',
    last_name: 'Smith',
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

  // Initialize modules
  await initializeAuth();
  if (isDatabaseEnabled) {
    await initializeDatabase();
  }

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

  // If database is not enabled, use demo authentication
  if (!isDatabaseEnabled) {
    const demoUsers = getDemoUsers();
    const demoUser = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!demoUser) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        hint: 'Demo emails: admin@techflow.io, security@growthcorp.com (password: any)'
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
      demoMode: true
    });
  }

  try {
    // Check if database is connected
    const connectionTest = await database.testConnection();
    if (!connectionTest.success) {
      return res.status(503).json({
        error: 'Database connection unavailable',
        code: 'DATABASE_ERROR'
      });
    }

    // Find user by email (includes organization info)
    const user = await userDAO.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password (we'll need to get password_hash from database)
    const passwordQuery = 'SELECT password_hash FROM users WHERE id = $1';
    const passwordResult = await database.query(passwordQuery, [user.id]);
    
    if (!passwordResult.rows[0]?.password_hash) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const isValidPassword = await AuthService.verifyPassword(password, passwordResult.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    await userDAO.updateLastLogin(user.id);

    // Create auth user object
    const authUser = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      organizationId: user.organization_id,
      organizationName: user.organization_name,
      organizationSlug: user.organization_slug
    };

    // Generate JWT token
    const token = AuthService.generateToken(authUser);

    // Log the login
    console.log(`[Auth] User login: ${email} (${user.organization_name})`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        ...authUser,
        displayName: AuthService.getDisplayName(authUser)
      },
      token,
      organization: {
        id: user.organization_id,
        name: user.organization_name,
        slug: user.organization_slug
      },
      demoMode: false
    });

  } catch (error) {
    console.error('[Auth] Login error:', error);
    
    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
}