// Development server to handle API routes alongside Vite
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory demo data for development
const demoUsers = [
  {
    id: '1',
    email: 'demo@techflowstartup.com',
    password: 'demo123', // In production, this would be hashed
    firstName: 'Demo',
    lastName: 'User',
    role: 'owner',
    organizationId: 'org1',
    organizationName: 'TechFlow Startup',
    organizationSlug: 'techflow-startup'
  },
  {
    id: '2', 
    email: 'admin@growthcorp.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    organizationId: 'org2',
    organizationName: 'GrowthCorp SMB',
    organizationSlug: 'growthcorp-smb'
  }
];

// Simple JWT simulation for development
const generateToken = (user) => {
  // In development, just base64 encode the user data
  return Buffer.from(JSON.stringify({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    organizationId: user.organizationId,
    organizationName: user.organizationName,
    organizationSlug: user.organizationSlug,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  })).toString('base64');
};

const verifyToken = (token) => {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return decoded;
  } catch {
    return null;
  }
};

// API Routes
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required',
        code: 'MISSING_FIELDS' 
      });
    }
    
    // Find user in demo data
    const user = demoUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS' 
      });
    }
    
    const token = generateToken(user);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organizationName,
        organizationSlug: user.organizationSlug
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, firstName, lastName, organizationName, companyType, industry } = req.body;
    
    if (!email || !password || !firstName || !lastName || !organizationName) {
      return res.status(400).json({ 
        error: 'All fields are required',
        code: 'MISSING_FIELDS' 
      });
    }
    
    // Check if user already exists
    const existingUser = demoUsers.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists',
        code: 'USER_EXISTS' 
      });
    }
    
    // Create new user (in development, just add to memory)
    const newUser = {
      id: String(demoUsers.length + 1),
      email,
      password, // In production, this would be hashed
      firstName,
      lastName,
      role: 'owner',
      organizationId: `org${demoUsers.length + 1}`,
      organizationName,
      organizationSlug: organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
    };
    
    demoUsers.push(newUser);
    
    const token = generateToken(newUser);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        organizationId: newUser.organizationId,
        organizationName: newUser.organizationName,
        organizationSlug: newUser.organizationSlug
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'MISSING_TOKEN'
      });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'MISSING_TOKEN'
      });
    }
    
    const user = verifyToken(token);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
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
    console.error('Me API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Development API server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Development API server running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/register'); 
  console.log('  GET /api/auth/me');
  console.log('  GET /api/health');
  console.log('🎭 Demo credentials:');
  console.log('  demo@techflowstartup.com / demo123');
  console.log('  admin@growthcorp.com / admin123');
});