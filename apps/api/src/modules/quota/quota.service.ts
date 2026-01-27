import { prisma } from '../../prisma/client';
import { ValidationError } from '../../libs/errors';
import { orgService } from '../orgs/org.service';

/**
 * Service for checking and managing user quota
 */
class QuotaService {
  /**
   * Get user's daily quota limit (from their org's plan)
   */
  async getUserQuotaLimit(userId: string): Promise<number> {
    // Get user's primary org
    const orgData = await orgService.getUserPrimaryOrg(userId);

    // Get org's subscription and plan
    const org = await prisma.organization.findUnique({
      where: { id: orgData.org.id },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!org?.subscription?.plan) {
      // Default to 100MB if no plan found
      return 100;
    }

    // Quota is per-user per-day (as per requirements)
    return org.subscription.plan.dailyQuotaMb;
  }

  /**
   * Get user's current daily usage (in MB)
   */
  async getUserDailyUsage(userId: string): Promise<number> {
    // Get today's date at midnight (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const usage = await prisma.usageDaily.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    return usage ? usage.usedMb - usage.refundedMb : 0;
  }

  /**
   * Check if user has enough quota for a file size (in MB)
   * Returns: { hasQuota: boolean, remaining: number, limit: number }
   */
  async checkQuota(userId: string, fileSizeMb: number): Promise<{
    hasQuota: boolean;
    remaining: number;
    limit: number;
    used: number;
  }> {
    const limit = await this.getUserQuotaLimit(userId);
    const used = await this.getUserDailyUsage(userId);
    const remaining = limit - used;

    return {
      hasQuota: remaining >= fileSizeMb,
      remaining,
      limit,
      used,
    };
  }

  /**
   * Validate quota and throw error if insufficient
   */
  async validateQuota(userId: string, fileSizeMb: number): Promise<void> {
    const quotaCheck = await this.checkQuota(userId, fileSizeMb);

    if (!quotaCheck.hasQuota) {
      throw new ValidationError(
        `Insufficient quota. You have ${quotaCheck.remaining}MB remaining, but need ${fileSizeMb}MB. Daily limit: ${quotaCheck.limit}MB.`
      );
    }
  }

  /**
   * Get quota info for user
   */
  async getQuotaInfo(userId: string) {
    const limit = await this.getUserQuotaLimit(userId);
    const used = await this.getUserDailyUsage(userId);
    const remaining = limit - used;

    return {
      limit,
      used,
      remaining,
      resetAt: this.getNextResetTime(),
    };
  }

  /**
   * Get next quota reset time (midnight UTC)
   */
  private getNextResetTime(): Date {
    const now = new Date();
    const reset = new Date(now);
    reset.setUTCHours(24, 0, 0, 0); // Next midnight UTC
    return reset;
  }
}

export const quotaService = new QuotaService();

