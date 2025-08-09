// User registration API endpoint
// Creates new organization and owner user

// Database connection (optional)
let database, organizationDAO, userDAO;
const isDatabaseEnabled = process.env.ENABLE_DATABASE === 'true';

async function initializeDatabase() {
  if (!isDatabaseEnabled) {
    return;
  }

  try {
    const dbModule = await import('../../lib/database.ts');
    database = dbModule.default;
    organizationDAO = dbModule.organizationDAO;
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

  // Validate password strength
  const passwordValidation = AuthService.validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({
      error: 'Password does not meet requirements',
      code: 'WEAK_PASSWORD',
      details: passwordValidation.errors
    });
  }

  // If database is not enabled, return mock success
  if (!isDatabaseEnabled) {
    const mockUser = {
      id: 'user_demo_owner',
      email,
      firstName,
      lastName,
      role: 'owner',
      organizationId: 'org_demo_startup',
      organizationName,
      organizationSlug: AuthService.generateOrgSlug(organizationName)
    };

    const token = AuthService.generateToken(mockUser);

    return res.status(201).json({
      success: true,
      message: 'Registration successful (demo mode)',
      user: mockUser,
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

    // Check if user already exists
    const existingUser = await userDAO.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        code: 'USER_EXISTS'
      });
    }

    // Generate organization slug
    const orgSlug = AuthService.generateOrgSlug(organizationName);

    // Create organization and user in transaction
    const result = await database.transaction(async (query) => {
      // Create organization
      const org = await organizationDAO.create({
        name: organizationName,
        slug: orgSlug,
        type: organizationType,
        employees: employees ? parseInt(employees) : undefined,
        industry,
        primaryEmail: email
      });

      // Hash password
      const hashedPassword = await AuthService.hashPassword(password);

      // Create owner user
      const user = await userDAO.create({
        organizationId: org.id,
        email,
        firstName,
        lastName,
        role: 'owner'
      });

      // Update user with hashed password (we'll need to add this to the schema)
      await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, user.id]);

      return { org, user };
    });

    // Create auth user object
    const authUser = {
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.first_name,
      lastName: result.user.last_name,
      role: result.user.role,
      organizationId: result.org.id,
      organizationName: result.org.name,
      organizationSlug: result.org.slug
    };

    // Generate JWT token
    const token = AuthService.generateToken(authUser);

    // Log the registration
    console.log(`[Auth] New user registered: ${email} for organization: ${organizationName}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        ...authUser,
        displayName: AuthService.getDisplayName(authUser)
      },
      token,
      organization: {
        id: result.org.id,
        name: result.org.name,
        slug: result.org.slug,
        type: result.org.type
      },
      demoMode: false
    });

  } catch (error) {
    console.error('[Auth] Registration error:', error);
    
    if (error.message.includes('duplicate key')) {
      return res.status(409).json({
        error: 'Organization name or email already exists',
        code: 'DUPLICATE_DATA'
      });
    }

    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
}