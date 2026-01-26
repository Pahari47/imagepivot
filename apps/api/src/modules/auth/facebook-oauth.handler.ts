import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { env } from '../../config/env';
import { authService } from './auth.service';

if (env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET && env.FACEBOOK_CALLBACK_URL) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: env.FACEBOOK_APP_ID,
        clientSecret: env.FACEBOOK_APP_SECRET,
        callbackURL: env.FACEBOOK_CALLBACK_URL,
        profileFields: ['id', 'displayName', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const oauthData = {
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName || profile.name?.givenName || undefined,
            providerUserId: profile.id,
            provider: 'FACEBOOK' as const,
          };

          if (!oauthData.email) {
            return done(new Error('No email provided by Facebook'), null);
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

export const facebookAuth = passport.authenticate('facebook', {
  scope: ['email'],
});

export const facebookCallback = passport.authenticate('facebook', {
  session: false,
  failureRedirect: `${env.FRONTEND_URL}/auth/login?error=oauth_failed`,
});

