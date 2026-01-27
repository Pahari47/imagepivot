import bcrypt from 'bcryptjs';
import { prisma } from '../../prisma/client';
import { generateJWT, generateTokenHash, hashToken } from '../../libs/tokens';
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '../../libs/errors';
import { AuthProvider } from '@prisma/client';

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface OAuthUserData {
  email: string;
  name?: string;
  providerUserId: string;
  provider: 'GOOGLE' | 'FACEBOOK';
}

class AuthService {
  async register(input: RegisterInput) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        provider: AuthProvider.EMAIL,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = generateJWT({
      userId: user.id,
      email: user.email,
      provider: 'EMAIL',
    });

    return {
      user,
      token,
    };
  }

  async login(input: LoginInput) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user has password (EMAIL provider)
    if (user.provider !== AuthProvider.EMAIL || !user.passwordHash) {
      throw new UnauthorizedError(
        'This email is registered with a social account. Please use social login.'
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate JWT token
    const token = generateJWT({
      userId: user.id,
      email: user.email,
      provider: 'EMAIL',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async handleOAuthLogin(oauthData: OAuthUserData) {
    // Check if user exists by providerUserId
    const existingUser = await prisma.user.findUnique({
      where: { providerUserId: oauthData.providerUserId },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (existingUser) {
      // User exists, generate token
      const token = generateJWT({
        userId: existingUser.id,
        email: existingUser.email,
        provider: oauthData.provider,
      });

      return {
        user: existingUser,
        token,
        isNewUser: false,
      };
    }

    // Check if email already exists (different provider)
    const existingByEmail = await prisma.user.findUnique({
      where: { email: oauthData.email },
    });

    if (existingByEmail) {
      throw new ConflictError(
        'An account with this email already exists. Please use the original login method.'
      );
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email: oauthData.email,
        name: oauthData.name,
        provider: oauthData.provider,
        providerUserId: oauthData.providerUserId,
        emailVerified: true, // OAuth providers verify email
      },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    const token = generateJWT({
      userId: newUser.id,
      email: newUser.email,
      provider: oauthData.provider,
    });

    return {
      user: newUser,
      token,
      isNewUser: true,
    };
  }

  async generateEmailVerificationToken(userId: string) {
    const token = generateTokenHash();
    const tokenHash = hashToken(token);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return token;
  }

  async verifyEmail(token: string) {
    const tokenHash = hashToken(token);

    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new ValidationError('Invalid verification token');
    }

    if (verificationToken.usedAt) {
      throw new ValidationError('Verification token already used');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new ValidationError('Verification token expired');
    }

    // Mark token as used and verify user email
    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      }),
    ]);

    return {
      message: 'Email verified successfully',
    };
  }

  async generatePasswordResetToken(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.provider !== AuthProvider.EMAIL) {
      // Don't reveal if user exists for security
      return null;
    }

    const token = generateTokenHash();
    const tokenHash = hashToken(token);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return token;
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      throw new ValidationError('Invalid reset token');
    }

    if (resetToken.usedAt) {
      throw new ValidationError('Reset token already used');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new ValidationError('Reset token expired');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Mark token as used and update password
    await prisma.$transaction([
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
    ]);

    return {
      message: 'Password reset successfully',
    };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return user;
  }
}

export const authService = new AuthService();

