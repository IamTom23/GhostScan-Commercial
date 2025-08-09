// User profile API endpoint - verifies JWT and returns user info

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
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Initialize auth
  await initializeAuth();

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
    demoMode: false // This will be true for demo users in production
  });
}