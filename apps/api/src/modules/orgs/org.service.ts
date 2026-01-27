import { prisma } from '../../prisma/client';
import { ConflictError, NotFoundError, ValidationError } from '../../libs/errors';
import { OrgRole, OrgType, PlanScope } from '@prisma/client';

interface CreatePersonalOrgInput {
  userId: string;
  userName?: string | null;
  userEmail: string;
}

interface CreateOrgInput {
  name: string;
  userId: string; // Creator becomes OWNER
}

class OrgService {
  /**
   * Create a personal org for a new user (automatically called on registration)
   */
  async createPersonalOrg(input: CreatePersonalOrgInput) {
    const { userId, userName, userEmail } = input;

    // Check if user already has a personal org
    const existingMembership = await prisma.orgMember.findFirst({
      where: {
        userId,
        org: {
          type: OrgType.PERSONAL,
        },
      },
      include: {
        org: true,
      },
    });

    if (existingMembership) {
      return existingMembership.org;
    }

    // Generate unique slug from email
    const baseSlug = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Get or create FREE plan
    let freePlan = await prisma.plan.findUnique({
      where: { code: 'FREE' },
    });

    if (!freePlan) {
      freePlan = await prisma.plan.create({
        data: {
          name: 'Free Plan',
          code: 'FREE',
          scope: PlanScope.INDIVIDUAL,
          isCustom: false,
          dailyQuotaMb: 100, // Default free quota
          seatLimit: 1,
        },
      });
    }

    // Create org, membership, and subscription in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const org = await tx.organization.create({
        data: {
          name: userName ? `${userName}'s Workspace` : `${userEmail}'s Workspace`,
          slug,
          type: OrgType.PERSONAL,
          seatLimit: 1,
        },
      });

      // Create membership (user is OWNER)
      await tx.orgMember.create({
        data: {
          orgId: org.id,
          userId,
          role: OrgRole.OWNER,
        },
      });

      // Create subscription with FREE plan
      await tx.subscription.create({
        data: {
          orgId: org.id,
          planId: freePlan.id,
          status: 'ACTIVE', // FREE plan is always active
        },
      });

      return org;
    });

    return result;
  }

  /**
   * Create a business org (for premium/enterprise plans)
   */
  async createOrg(input: CreateOrgInput) {
    const { name, userId } = input;

    // Validate name
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Organization name is required');
    }

    if (name.length > 100) {
      throw new ValidationError('Organization name must be less than 100 characters');
    }

    // Generate unique slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create org and membership in transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: name.trim(),
          slug,
          type: OrgType.BUSINESS,
          seatLimit: 1, // Will be updated when subscription is created
        },
      });

      await tx.orgMember.create({
        data: {
          orgId: org.id,
          userId,
          role: OrgRole.OWNER,
        },
      });

      return org;
    });

    return result;
  }

  /**
   * Get user's primary org (first org where user is OWNER, or first org if no OWNER org)
   */
  async getUserPrimaryOrg(userId: string) {
    // Try to find org where user is OWNER
    let membership = await prisma.orgMember.findFirst({
      where: {
        userId,
        role: OrgRole.OWNER,
      },
      include: {
        org: {
          include: {
            subscription: {
              include: {
                plan: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // First org created
      },
    });

    // If no OWNER org, get first org
    if (!membership) {
      membership = await prisma.orgMember.findFirst({
        where: {
          userId,
        },
        include: {
          org: {
            include: {
              subscription: {
                include: {
                  plan: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    }

    if (!membership) {
      throw new NotFoundError('User has no organization');
    }

    return {
      org: membership.org,
      role: membership.role,
    };
  }

  /**
   * Get org details with membership check
   */
  async getOrgDetails(orgId: string, userId: string) {
    // Verify user is member of org
    const membership = await prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
      include: {
        org: {
          include: {
            subscription: {
              include: {
                plan: true,
              },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundError('Organization not found or access denied');
    }

    return {
      org: membership.org,
      role: membership.role,
    };
  }

  /**
   * Update org (only OWNER can update)
   */
  async updateOrg(orgId: string, userId: string, updates: { name?: string }) {
    // Verify user is OWNER
    const membership = await prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundError('Organization not found or access denied');
    }

    if (membership.role !== OrgRole.OWNER) {
      throw new ValidationError('Only organization owner can update organization');
    }

    const updateData: { name?: string } = {};

    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new ValidationError('Organization name cannot be empty');
      }
      if (updates.name.length > 100) {
        throw new ValidationError('Organization name must be less than 100 characters');
      }
      updateData.name = updates.name.trim();
    }

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    const org = await prisma.organization.update({
      where: { id: orgId },
      data: updateData,
    });

    return org;
  }

  /**
   * Get user's role in a specific org
   */
  async getUserOrgRole(userId: string, orgId: string): Promise<OrgRole | null> {
    const membership = await prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    return membership?.role || null;
  }

  /**
   * Verify user has access to org (throws if not)
   */
  async ensureOrgAccess(userId: string, orgId: string, requiredRole?: OrgRole) {
    const membership = await prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundError('Organization not found or access denied');
    }

    if (requiredRole) {
      if (requiredRole === OrgRole.OWNER && membership.role !== OrgRole.OWNER) {
        throw new ValidationError('This action requires organization owner role');
      }
    }

    return membership.role;
  }
}

export const orgService = new OrgService();

