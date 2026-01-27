import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { env } from '../../config/env';
import { AppError } from '../../libs/errors';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
        });
      }

      const result = await authService.register({ email, password, name });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
        });
      }

      const result = await authService.login({ email, password });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async googleCallback(req: Request, res: Response) {
    try {
      const result = req.user as {
        user: unknown;
        token: string;
        isNewUser: boolean;
      };

      // Redirect to frontend with token
      const redirectUrl = new URL(`${env.FRONTEND_URL}/auth/callback`);
      redirectUrl.searchParams.set('token', result.token);
      redirectUrl.searchParams.set('provider', 'google');
      if (result.isNewUser) {
        redirectUrl.searchParams.set('newUser', 'true');
      }

      res.redirect(redirectUrl.toString());
    } catch (error) {
      res.redirect(
        `${env.FRONTEND_URL}/auth/login?error=oauth_callback_failed`
      );
    }
  }

  async facebookCallback(req: Request, res: Response) {
    try {
      const result = req.user as {
        user: unknown;
        token: string;
        isNewUser: boolean;
      };

      // Redirect to frontend with token
      const redirectUrl = new URL(`${env.FRONTEND_URL}/auth/callback`);
      redirectUrl.searchParams.set('token', result.token);
      redirectUrl.searchParams.set('provider', 'facebook');
      if (result.isNewUser) {
        redirectUrl.searchParams.set('newUser', 'true');
      }

      res.redirect(redirectUrl.toString());
    } catch (error) {
      res.redirect(
        `${env.FRONTEND_URL}/auth/login?error=oauth_callback_failed`
      );
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: 'Verification token is required',
        });
      }

      const result = await authService.verifyEmail(token);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
        });
      }

      const token = await authService.generateEmailVerificationToken(userId);

      // TODO: Send email with verification link
      // For now, return token (remove in production)
      res.json({
        success: true,
        message: 'Verification email sent',
        data: {
          token: process.env.NODE_ENV === 'development' ? token : undefined,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          error: 'Email is required',
        });
      }

      const token = await authService.generatePasswordResetToken(email);

      // Always return success (don't reveal if user exists)
      // TODO: Send email with reset link
      res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
        data: {
          token: process.env.NODE_ENV === 'development' ? token : undefined,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({
          error: 'Token and password are required',
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          error: 'Password must be at least 8 characters',
        });
      }

      const result = await authService.resetPassword(token, password);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
        });
      }

      const user = await authService.getCurrentUser(userId);

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

