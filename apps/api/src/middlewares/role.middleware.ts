import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '../libs/errors';
import { orgService } from '../modules/orgs/org.service';
import { OrgRole, GlobalRole } from '@prisma/client';

/**
 * Middleware to require a specific global role
 * Usage: router.get('/admin/users', requireGlobalRole('SUPER_ADMIN'), ...)
 */
export function requireGlobalRole(requiredRole: GlobalRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (authReq.user.globalRole !== requiredRole) {
      return next(
        new ForbiddenError(
          `This action requires ${requiredRole} role. Current role: ${authReq.user.globalRole}`
        )
      );
    }

    next();
  };
}

/**
 * Middleware to require a specific org role
 * Expects orgId in req.params.orgId or req.body.orgId
 * Usage: router.put('/orgs/:orgId', requireOrgRole('OWNER'), ...)
 */
export function requireOrgRole(requiredRole: OrgRole) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const orgId = req.params.orgId || req.body.orgId;

    if (!orgId) {
      return next(new NotFoundError('Organization ID is required'));
    }

    try {
      // Verify user has access to org and required role
      const userRole = await orgService.ensureOrgAccess(
        authReq.user.userId,
        orgId,
        requiredRole
      );

      // Store org info in request for use in controllers
      (req as any).orgId = orgId;
      (req as any).orgRole = userRole;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to verify user is a member of the org (any role)
 * Expects orgId in req.params.orgId or req.body.orgId
 * Usage: router.get('/orgs/:orgId/jobs', requireOrgMembership(), ...)
 */
export function requireOrgMembership() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const orgId = req.params.orgId || req.body.orgId;

    if (!orgId) {
      return next(new NotFoundError('Organization ID is required'));
    }

    try {
      // Verify user has access to org
      const userRole = await orgService.ensureOrgAccess(authReq.user.userId, orgId);

      // Store org info in request
      (req as any).orgId = orgId;
      (req as any).orgRole = userRole;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Helper to get orgId from request (from middleware or params)
 */
export function getOrgIdFromRequest(req: Request): string {
  // Check if middleware already set it
  if ((req as any).orgId) {
    return (req as any).orgId;
  }

  // Fallback to params or body
  return req.params.orgId || req.body.orgId || '';
}

