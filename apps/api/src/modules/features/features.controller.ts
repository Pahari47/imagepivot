import { Request, Response, NextFunction } from 'express';
import { featuresService } from './features.service';
import { getFeaturesQuerySchema } from './features.validation';
import { MediaType } from '@prisma/client';

export class FeaturesController {
  async getFeatures(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getFeaturesQuerySchema.parse(req.query);
      
      if (query.mediaType) {
        const features = await featuresService.getFeaturesByMediaType(query.mediaType);
        res.json({ success: true, data: features });
      } else {
        const features = await featuresService.getAllFeatures();
        res.json({ success: true, data: features });
      }
    } catch (error) {
      next(error);
    }
  }

  async getFeatureBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const feature = await featuresService.getFeatureBySlug(slug);
      res.json({ success: true, data: feature });
    } catch (error) {
      next(error);
    }
  }
}

export const featuresController = new FeaturesController();


