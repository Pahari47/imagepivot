import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { uploadService } from './upload.service';
import { quotaService } from '../quota/quota.service';
import { ValidationError } from '../../libs/errors';
import { requireOrgMembership } from '../../middlewares/role.middleware';

export class UploadController {
  /**
   * Generate presigned upload URL
   * POST /api/upload/presign
   * Body: { orgId, fileName, fileSize, mimeType, mediaType }
   */
  async generatePresignedUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { orgId, fileName, fileSize, mimeType, mediaType } = req.body;

      // Validate required fields
      if (!orgId || !fileName || !fileSize || !mimeType || !mediaType) {
        return res.status(400).json({
          error: 'Missing required fields: orgId, fileName, fileSize, mimeType, mediaType',
        });
      }

      // Validate mediaType
      if (!['image', 'audio', 'video'].includes(mediaType)) {
        return res.status(400).json({
          error: 'Invalid mediaType. Must be one of: image, audio, video',
        });
      }

      // Validate fileSize is a number
      const fileSizeNum = Number(fileSize);
      if (isNaN(fileSizeNum) || fileSizeNum <= 0) {
        return res.status(400).json({
          error: 'fileSize must be a positive number',
        });
      }

      // Generate presigned URL (this will validate quota and org access)
      const result = await uploadService.generatePresignedUploadUrl({
        userId: authReq.user!.userId,
        orgId,
        fileName,
        fileSize: fileSizeNum,
        mimeType,
        mediaType: mediaType as 'image' | 'audio' | 'video',
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get quota information
   * GET /api/upload/quota
   */
  async getQuotaInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;

      const quotaInfo = await quotaService.getQuotaInfo(authReq.user!.userId);

      res.json({
        success: true,
        data: quotaInfo,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();

