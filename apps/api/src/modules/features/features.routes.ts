import { Router } from 'express';
import { featuresController } from './features.controller';

const router = Router();

router.get('/', featuresController.getFeatures.bind(featuresController));
router.get('/:slug', featuresController.getFeatureBySlug.bind(featuresController));

export default router;


