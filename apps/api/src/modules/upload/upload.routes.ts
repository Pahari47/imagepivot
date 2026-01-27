import { Router } from 'express';
import { uploadController } from './upload.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

// All upload routes require authentication
router.use(authMiddleware);

// Generate presigned upload URL
router.post('/presign', uploadController.generatePresignedUrl.bind(uploadController));

// Get quota information
router.get('/quota', uploadController.getQuotaInfo.bind(uploadController));

export default router;

