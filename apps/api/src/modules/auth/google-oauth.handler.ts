import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from '../../config/env';
import { authService } from './auth.service';

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const oauthData = {
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName || profile.name?.givenName || undefined,
            providerUserId: profile.id,
            provider: 'GOOGLE' as const,
          };

          if (!oauthData.email) {
            return done(new Error('No email provided by Google'), null);
          }

          const result = await authService.handleOAuthLogin(oauthData);
          return done(null, result);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

export const googleCallback = passport.authenticate('google', {
  session: false,
  failureRedirect: `${env.FRONTEND_URL}/auth/login?error=oauth_failed`,
});

