import express from 'express';
import passport from '../config/oauth';
import jwt from 'jsonwebtoken';
import { OAuthUser } from '../config/oauth';

const router = express.Router();

// JWT helper function
const generateJWT = (user: OAuthUser): string => {
  const payload = { 
    id: user.id, 
    email: user.email, 
    provider: user.provider 
  };
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  const options = { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions;
  
  return jwt.sign(payload, secret, options);
};

// Auth status endpoint
router.get('/status', (req, res) => {
  if (req.user) {
    res.json({ 
      authenticated: true, 
      user: req.user 
    });
  } else {
    res.json({ 
      authenticated: false 
    });
  }
});

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/calendar.readonly'
    ]
  })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure' }),
  (req, res) => {
    const user = req.user as OAuthUser;
    const token = generateJWT(user);
    
    // Determine organization from email domain
    const emailDomain = user.email.split('@')[1];
    const organizationHint = emailDomain !== 'gmail.com' && emailDomain !== 'outlook.com' ? emailDomain : null;
    
    // Redirect to frontend with token and organization hint
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = organizationHint 
      ? `${frontendUrl}/auth/success?token=${token}&provider=google&org_hint=${organizationHint}`
      : `${frontendUrl}/auth/success?token=${token}&provider=google`;
    
    res.redirect(redirectUrl);
  }
);

// Microsoft OAuth routes
router.get('/microsoft',
  passport.authenticate('microsoft', {
    scope: [
      'user.read',
      'mail.read',
      'calendars.read',
      'files.read'
    ]
  })
);

router.get('/microsoft/callback',
  passport.authenticate('microsoft', { failureRedirect: '/auth/failure' }),
  (req, res) => {
    const user = req.user as OAuthUser;
    const token = generateJWT(user);
    
    // Determine organization from email domain
    const emailDomain = user.email.split('@')[1];
    const organizationHint = emailDomain !== 'gmail.com' && emailDomain !== 'outlook.com' ? emailDomain : null;
    
    // Redirect to frontend with token and organization hint
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = organizationHint 
      ? `${frontendUrl}/auth/success?token=${token}&provider=microsoft&org_hint=${organizationHint}`
      : `${frontendUrl}/auth/success?token=${token}&provider=microsoft`;
    
    res.redirect(redirectUrl);
  }
);

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Auth failure page
router.get('/failure', (req, res) => {
  res.status(401).json({ 
    error: 'Authentication failed',
    message: 'Unable to authenticate with the selected provider'
  });
});

// Get connected accounts for organization
router.get('/connections/:organizationId?', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { organizationId } = req.params;
  const user = req.user as OAuthUser;
  
  // In production, this would query the database for organization's connected accounts
  // For now, return the current user's provider with organization context
  const emailDomain = user.email.split('@')[1];
  const isBusinessAccount = emailDomain !== 'gmail.com' && emailDomain !== 'outlook.com';
  
  res.json({
    connections: [
      {
        provider: user.provider,
        email: user.email,
        organizationDomain: isBusinessAccount ? emailDomain : null,
        accountType: isBusinessAccount ? 'business' : 'personal',
        connectedAt: new Date(),
        status: 'active',
        permissions: getProviderPermissions(user.provider)
      }
    ],
    organizationId: organizationId || null,
    businessAccount: isBusinessAccount
  });
});

// Helper function to get provider permissions
function getProviderPermissions(provider: string): string[] {
  switch (provider) {
    case 'google':
      return ['gmail.readonly', 'drive.readonly', 'calendar.readonly', 'admin.directory.user.readonly'];
    case 'microsoft':
      return ['mail.read', 'files.read', 'calendars.read', 'user.read'];
    default:
      return [];
  }
}

// Disconnect account from organization
router.delete('/connections/:provider/:organizationId?', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { provider, organizationId } = req.params;
  const user = req.user as OAuthUser;
  
  // In production, this would remove the connection from the organization's database
  console.log(`Disconnecting ${provider} for organization ${organizationId || 'personal'}, user:`, user.email);
  
  res.json({ 
    message: `Successfully disconnected ${provider} from ${organizationId ? 'organization' : 'personal account'}`,
    provider,
    organizationId: organizationId || null
  });
});

// Organization setup endpoint for business onboarding
router.post('/setup-organization', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = req.user as OAuthUser;
  const { organizationName, industry, size, employeeCount, complianceRequirements } = req.body;
  
  if (!organizationName) {
    return res.status(400).json({ error: 'Organization name is required' });
  }

  // Extract domain from user email for business accounts
  const emailDomain = user.email.split('@')[1];
  const isBusinessAccount = emailDomain !== 'gmail.com' && emailDomain !== 'outlook.com';
  
  const organizationData = {
    name: organizationName,
    domain: isBusinessAccount ? emailDomain : `${organizationName.toLowerCase().replace(/\s+/g, '')}.com`,
    adminEmail: user.email,
    industry: industry || 'Technology',
    size: size || 'STARTUP',
    employeeCount: employeeCount || 1,
    complianceRequirements: complianceRequirements || [],
    connectedProviders: [user.provider],
    setupCompleted: true
  };

  // In production, this would create the organization in the database
  console.log('Setting up organization:', organizationData);
  
  res.json({
    message: 'Organization setup completed successfully',
    organization: organizationData,
    nextSteps: [
      'Run initial security scan',
      'Review compliance requirements',
      'Set up team member access',
      'Configure security policies'
    ]
  });
});

// Business account validation endpoint
router.get('/validate-business-email/:email', (req, res) => {
  const { email } = req.params;
  const emailDomain = email.split('@')[1];
  
  // Check if it's a business domain
  const personalDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com'];
  const isBusinessEmail = !personalDomains.includes(emailDomain);
  
  res.json({
    isBusinessEmail,
    domain: emailDomain,
    suggestedOrgName: isBusinessEmail ? emailDomain.split('.')[0] : null,
    recommendations: isBusinessEmail 
      ? ['Use your business email for better integrations', 'Enable SSO for your team']
      : ['Consider using your business email', 'Personal accounts have limited features']
  });
});

export default router;