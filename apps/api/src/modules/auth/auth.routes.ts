import { Router } from 'express';
import { authController } from './auth.controller';
import { googleAuth, googleCallback } from './google-oauth.handler';
import { facebookAuth, facebookCallback } from './facebook-oauth.handler';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

// Email/Password auth
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));

// OAuth - Google
router.get('/google', googleAuth);
router.get(
  '/google/callback',
  googleCallback,
  authController.googleCallback.bind(authController)
);

// OAuth - Facebook
router.get('/facebook', facebookAuth);
router.get(
  '/facebook/callback',
  facebookCallback,
  authController.facebookCallback.bind(authController)
);

// Email verification
router.post('/verify-email', authController.verifyEmail.bind(authController));
router.post(
  '/resend-verification',
  authMiddleware,
  authController.resendVerification.bind(authController)
);

// Password reset
router.post('/forgot-password', authController.forgotPassword.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));

// Get current user (protected)
router.get('/me', authMiddleware, authController.me.bind(authController));

export default router;

