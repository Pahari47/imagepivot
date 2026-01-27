import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { orgService } from './org.service';
import { ValidationError } from '../../libs/errors';

export class OrgController {
  /**
   * Create a new business org
   * POST /api/orgs
   */
  async createOrg(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { name } = req.body;

      if (!name || typeof name !== 'string') {
        return res.status(400).json({
          error: 'Organization name is required',
        });
      }

      const org = await orgService.createOrg({
        name,
        userId: authReq.user!.userId,
      });

      res.status(201).json({
        success: true,
        data: { org },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's primary org
   * GET /api/orgs/me
   */
  async getMyOrg(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;

      const orgData = await orgService.getUserPrimaryOrg(authReq.user!.userId);

      res.json({
        success: true,
        data: {
          org: orgData.org,
          role: orgData.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get org details (requires membership)
   * GET /api/orgs/:orgId
   */
  async getOrgDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { orgId } = req.params;

      if (!orgId) {
        return res.status(400).json({
          error: 'Organization ID is required',
        });
      }

      const orgData = await orgService.getOrgDetails(orgId, authReq.user!.userId);

      res.json({
        success: true,
        data: {
          org: orgData.org,
          role: orgData.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update org (requires OWNER role)
   * PUT /api/orgs/:orgId
   */
  async updateOrg(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { orgId } = req.params;
      const { name } = req.body;

      if (!orgId) {
        return res.status(400).json({
          error: 'Organization ID is required',
        });
      }

      const org = await orgService.updateOrg(orgId, authReq.user!.userId, { name });

      res.json({
        success: true,
        data: { org },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const orgController = new OrgController();

