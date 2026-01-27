import bcrypt from 'bcryptjs';
import { prisma } from '../../prisma/client';
import { generateJWT, generateTokenHash, hashToken } from '../../libs/tokens';
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '../../libs/errors';
import { AuthProvider, GlobalRole } from '@prisma/client';
import { orgService } from '../orgs/org.service';
import { env } from '../../config/env';

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  requestOrigin?: string; // For determining globalRole
}

export interface LoginInput {
  email: string;
  password: string;
  requestOrigin?: string; // For determining globalRole (only for new logins)
}

export interface OAuthUserData {
  email: string;
  name?: string;
  providerUserId: string;
  provider: 'GOOGLE' | 'FACEBOOK';
  requestOrigin?: string; // For determining globalRole
}

class AuthService {
  /**
   * Determine globalRole based on request origin
   */
  private getGlobalRoleFromOrigin(origin?: string): GlobalRole {
    if (!origin) {
      return GlobalRole.USER; // Default to USER
    }

    try {
      const originUrl = new URL(origin);
      const adminOrigin = new URL(env.ADMIN_FRONTEND_ORIGIN);

      // Check if origin matches admin frontend
      if (originUrl.origin === adminOrigin.origin) {
        return GlobalRole.SUPER_ADMIN;
      }
    } catch (error) {
      // Invalid URL, default to USER
    }

    return GlobalRole.USER;
  }

  async register(input: RegisterInput) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Determine globalRole from request origin
    const globalRole = this.getGlobalRoleFromOrigin(input.requestOrigin);

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 12);

    // Create user with globalRole
    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        provider: AuthProvider.EMAIL,
        emailVerified: false,
        globalRole,
      },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        emailVerified: true,
        globalRole: true,
        createdAt: true,
      },
    });

    // Auto-create personal org for new user
    const org = await orgService.createPersonalOrg({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
    });

    // Get user's role in org
    const orgRole = await orgService.getUserOrgRole(user.id, org.id);

    // Generate JWT token with org info
    const token = generateJWT({
      userId: user.id,
      email: user.email,
      provider: 'EMAIL',
      globalRole: user.globalRole,
      primaryOrgId: org.id,
      primaryOrgRole: orgRole || 'OWNER',
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

    // Update globalRole if request is from admin-web (but user is not already SUPER_ADMIN)
    // This allows admin-web logins to automatically get SUPER_ADMIN role
    let finalGlobalRole = user.globalRole;
    if (input.requestOrigin) {
      const requestedRole = this.getGlobalRoleFromOrigin(input.requestOrigin);
      if (requestedRole === GlobalRole.SUPER_ADMIN && user.globalRole !== GlobalRole.SUPER_ADMIN) {
        // Update user's globalRole if logging in from admin-web
        await prisma.user.update({
          where: { id: user.id },
          data: { globalRole: GlobalRole.SUPER_ADMIN },
        });
        finalGlobalRole = GlobalRole.SUPER_ADMIN;
      }
    }

    // Ensure user has a personal org (in case they were created before auto-org feature)
    let primaryOrg;
    try {
      const orgData = await orgService.getUserPrimaryOrg(user.id);
      primaryOrg = orgData.org;
    } catch (error) {
      // User has no org, create one
      primaryOrg = await orgService.createPersonalOrg({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
      });
    }

    // Get user's role in primary org
    const orgRole = await orgService.getUserOrgRole(user.id, primaryOrg.id);

    // Generate JWT token with org info
    const token = generateJWT({
      userId: user.id,
      email: user.email,
      provider: 'EMAIL',
      globalRole: finalGlobalRole,
      primaryOrgId: primaryOrg.id,
      primaryOrgRole: orgRole || 'OWNER',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
        emailVerified: user.emailVerified,
        globalRole: finalGlobalRole,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async handleOAuthLogin(oauthData: OAuthUserData) {
    // Determine globalRole from request origin
    const globalRole = this.getGlobalRoleFromOrigin(oauthData.requestOrigin);

    // Check if user exists by providerUserId
    const existingUser = await prisma.user.findUnique({
      where: { providerUserId: oauthData.providerUserId },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        emailVerified: true,
        globalRole: true,
        createdAt: true,
      },
    });

    if (existingUser) {
      // Update globalRole if logging in from admin-web
      let finalGlobalRole = existingUser.globalRole;
      if (oauthData.requestOrigin) {
        const requestedRole = this.getGlobalRoleFromOrigin(oauthData.requestOrigin);
        if (requestedRole === GlobalRole.SUPER_ADMIN && existingUser.globalRole !== GlobalRole.SUPER_ADMIN) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { globalRole: GlobalRole.SUPER_ADMIN },
          });
          finalGlobalRole = GlobalRole.SUPER_ADMIN;
        }
      }

      // Ensure user has org
      let primaryOrg;
      try {
        const orgData = await orgService.getUserPrimaryOrg(existingUser.id);
        primaryOrg = orgData.org;
      } catch (error) {
        primaryOrg = await orgService.createPersonalOrg({
          userId: existingUser.id,
          userName: existingUser.name,
          userEmail: existingUser.email,
        });
      }

      const orgRole = await orgService.getUserOrgRole(existingUser.id, primaryOrg.id);

      // User exists, generate token
      const token = generateJWT({
        userId: existingUser.id,
        email: existingUser.email,
        provider: oauthData.provider,
        globalRole: finalGlobalRole,
        primaryOrgId: primaryOrg.id,
        primaryOrgRole: orgRole || 'OWNER',
      });

      return {
        user: {
          ...existingUser,
          globalRole: finalGlobalRole,
        },
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
        globalRole,
      },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        emailVerified: true,
        globalRole: true,
        createdAt: true,
      },
    });

    // Auto-create personal org
    const org = await orgService.createPersonalOrg({
      userId: newUser.id,
      userName: newUser.name,
      userEmail: newUser.email,
    });

    const orgRole = await orgService.getUserOrgRole(newUser.id, org.id);

    const token = generateJWT({
      userId: newUser.id,
      email: newUser.email,
      provider: oauthData.provider,
      globalRole: newUser.globalRole,
      primaryOrgId: org.id,
      primaryOrgRole: orgRole || 'OWNER',
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
        globalRole: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Get primary org info
    let primaryOrg = null;
    let primaryOrgRole = null;
    try {
      const orgData = await orgService.getUserPrimaryOrg(userId);
      primaryOrg = {
        id: orgData.org.id,
        name: orgData.org.name,
        slug: orgData.org.slug,
        type: orgData.org.type,
      };
      primaryOrgRole = orgData.role;
    } catch (error) {
      // User has no org (shouldn't happen, but handle gracefully)
    }

    return {
      ...user,
      primaryOrg,
      primaryOrgRole,
    };
  }
}

export const authService = new AuthService();

