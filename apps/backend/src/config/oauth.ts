import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';

export interface OAuthUser {
  id: string;
  email: string;
  name: string;
  provider: string;
  accessToken: string;
  refreshToken?: string;
  profilePicture?: string;
}

// Mock user store - replace with database in production
const users: Map<string, OAuthUser> = new Map();

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id: string, done) => {
  const user = users.get(id);
  done(null, user || false);
});

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
      const user: OAuthUser = {
        id: `google_${profile.id}`,
        email: profile.emails?.[0]?.value || '',
        name: profile.displayName || '',
        provider: 'google',
        accessToken,
        refreshToken,
        profilePicture: profile.photos?.[0]?.value
      };

      users.set(user.id, user);
      console.log('Google OAuth user authenticated:', user.email);
      
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
      const user: OAuthUser = {
        id: `microsoft_${profile.id}`,
        email: profile.emails?.[0]?.value || profile._json?.mail || profile._json?.userPrincipalName || '',
        name: profile.displayName || profile._json?.displayName || '',
        provider: 'microsoft',
        accessToken,
        refreshToken,
        profilePicture: profile.photos?.[0]?.value
      };

      users.set(user.id, user);
      console.log('Microsoft OAuth user authenticated:', user.email);
      
      return done(null, user);
    } catch (error) {
      console.error('Microsoft OAuth error:', error);
      return done(error, null);
    }
  }));
}

export default passport;