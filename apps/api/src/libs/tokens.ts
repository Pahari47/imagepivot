import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

export interface JWTPayload {
  userId: string;
  email: string;
  provider: 'EMAIL' | 'GOOGLE' | 'FACEBOOK';
  globalRole: 'USER' | 'SUPER_ADMIN';
  primaryOrgId?: string;
  primaryOrgRole?: 'OWNER' | 'MEMBER';
}

export function generateJWT(payload: JWTPayload): string {
  return jwt.sign(
    payload,
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
    } as SignOptions
  );
}

export function verifyJWT(token: string): JWTPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

export function generateTokenHash(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

