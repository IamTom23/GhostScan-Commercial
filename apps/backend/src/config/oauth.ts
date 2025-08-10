import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { supabaseUserDAO, supabaseOrganizationDAO } from '../lib/supabase';

export interface OAuthUser {
  id: string;
  email: string;
  name: string;
  provider: string;
  accessToken: string;
  refreshToken?: string;
  profilePicture?: string;
  organizationId?: string;
  role?: string;
}

// Serialize user for session using database ID
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session using Supabase
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await supabaseUserDAO.findByEmail(id);
    if (user) {
      const oauthUser: OAuthUser = {
        id: user.id,
        email: user.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        provider: Object.keys(user.oauth_providers || {})[0] || 'unknown',
        accessToken: '', // Will be refreshed from OAuth providers
        organizationId: user.organization_id,
        role: user.role
      };
      done(null, oauthUser);
    } else {
      done(null, false);
    }
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error, false);
  }
});

// Helper function to create or find organization for business emails
async function findOrCreateOrganization(email: string): Promise<string | null> {
  const emailDomain = email.split('@')[1];
  const personalDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com'];
  
  if (personalDomains.includes(emailDomain)) {
    return null; // Personal email, no organization
  }

  // Check if organization exists by domain
  const slug = emailDomain.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const existingOrg = await supabaseOrganizationDAO.findBySlug(slug);
  
  if (existingOrg) {
    return existingOrg.id;
  }

  // Create new organization for business domain
  const orgName = emailDomain.split('.')[0]
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  try {
    const newOrg = await supabaseOrganizationDAO.create({
      name: orgName,
      slug,
      type: 'smb',
      employees: 1,
      industry: 'Technology',
      website: emailDomain,
      primaryEmail: email
    });
    
    console.log('Created new organization:', newOrg.name);
    return newOrg.id;
  } catch (error) {
    console.error('Failed to create organization:', error);
    return null;
  }
}

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_REDIRECT_URI || '/auth/google/callback',
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/admin.directory.user.readonly'
    ]
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      const email = profile.emails?.[0]?.value || '';
      const firstName = profile.name?.givenName || '';
      const lastName = profile.name?.familyName || '';
      
      if (!email) {
        return done(new Error('No email provided by Google'), null);
      }

      // Check if user already exists
      let existingUser = await supabaseUserDAO.findByEmail(email);
      
      if (existingUser) {
        // Update OAuth provider data
        const updatedOAuthProviders = {
          ...existingUser.oauth_providers,
          google: {
            id: profile.id,
            accessToken,
            refreshToken,
            profilePicture: profile.photos?.[0]?.value
          }
        };

        // Update OAuth providers and last login
        await supabaseUserDAO.updateOAuthProviders(existingUser.id, updatedOAuthProviders);
        await supabaseUserDAO.updateLastLogin(existingUser.id);
        
        const user: OAuthUser = {
          id: existingUser.id,
          email: existingUser.email,
          name: `${existingUser.first_name || ''} ${existingUser.last_name || ''}`.trim(),
          provider: 'google',
          accessToken,
          refreshToken,
          profilePicture: profile.photos?.[0]?.value,
          organizationId: existingUser.organization_id,
          role: existingUser.role
        };

        console.log('Google OAuth user logged in:', email);
        return done(null, user);
      }

      // Create new user
      const organizationId = await findOrCreateOrganization(email);
      
      const newUser = await supabaseUserDAO.create({
        organizationId: organizationId || `personal_${Date.now()}`,
        email,
        firstName,
        lastName,
        role: organizationId ? 'admin' : 'member'
      });

      const user: OAuthUser = {
        id: newUser.id,
        email: newUser.email,
        name: `${firstName} ${lastName}`.trim(),
        provider: 'google',
        accessToken,
        refreshToken,
        profilePicture: profile.photos?.[0]?.value,
        organizationId: newUser.organization_id,
        role: newUser.role
      };

      console.log('Google OAuth user created:', email);
      return done(null, user);
      
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }));
}

// Microsoft OAuth Strategy
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: process.env.MICROSOFT_REDIRECT_URI || '/auth/microsoft/callback',
    scope: ['user.read', 'mail.read', 'files.read', 'calendars.read']
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      const email = profile.emails?.[0]?.value || profile._json?.mail || profile._json?.userPrincipalName || '';
      const displayName = profile.displayName || profile._json?.displayName || '';
      const firstName = profile._json?.givenName || displayName.split(' ')[0] || '';
      const lastName = profile._json?.surname || displayName.split(' ').slice(1).join(' ') || '';
      
      if (!email) {
        return done(new Error('No email provided by Microsoft'), null);
      }

      // Check if user already exists
      let existingUser = await supabaseUserDAO.findByEmail(email);
      
      if (existingUser) {
        // Update OAuth provider data
        const updatedOAuthProviders = {
          ...existingUser.oauth_providers,
          microsoft: {
            id: profile.id,
            accessToken,
            refreshToken,
            profilePicture: profile.photos?.[0]?.value
          }
        };

        // Update OAuth providers and last login
        await supabaseUserDAO.updateOAuthProviders(existingUser.id, updatedOAuthProviders);
        await supabaseUserDAO.updateLastLogin(existingUser.id);
        
        const user: OAuthUser = {
          id: existingUser.id,
          email: existingUser.email,
          name: `${existingUser.first_name || ''} ${existingUser.last_name || ''}`.trim(),
          provider: 'microsoft',
          accessToken,
          refreshToken,
          profilePicture: profile.photos?.[0]?.value,
          organizationId: existingUser.organization_id,
          role: existingUser.role
        };

        console.log('Microsoft OAuth user logged in:', email);
        return done(null, user);
      }

      // Create new user
      const organizationId = await findOrCreateOrganization(email);
      
      const newUser = await supabaseUserDAO.create({
        organizationId: organizationId || `personal_${Date.now()}`,
        email,
        firstName,
        lastName,
        role: organizationId ? 'admin' : 'member'
      });

      const user: OAuthUser = {
        id: newUser.id,
        email: newUser.email,
        name: `${firstName} ${lastName}`.trim(),
        provider: 'microsoft',
        accessToken,
        refreshToken,
        profilePicture: profile.photos?.[0]?.value,
        organizationId: newUser.organization_id,
        role: newUser.role
      };

      console.log('Microsoft OAuth user created:', email);
      return done(null, user);
      
    } catch (error) {
      console.error('Microsoft OAuth error:', error);
      return done(error, null);
    }
  }));
}

export default passport;