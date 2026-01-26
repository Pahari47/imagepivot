import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../libs/tokens';
import { UnauthorizedError } from '../libs/errors';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    provider: 'EMAIL' | 'GOOGLE' | 'FACEBOOK';
  };
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const payload = verifyJWT(token);

    (req as AuthRequest).user = {
      userId: payload.userId,
      email: payload.email,
      provider: payload.provider,
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      return next(new UnauthorizedError(error.message));
    }
    next(new UnauthorizedError('Invalid token'));
  }
}

