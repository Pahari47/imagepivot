import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import orgRoutes from '../modules/orgs/org.routes';
import uploadRoutes from '../modules/upload/upload.routes';
import jobsRoutes from '../modules/jobs/jobs.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
router.use('/auth', authRoutes);

// Org routes
router.use('/orgs', orgRoutes);

// Upload routes
router.use('/upload', uploadRoutes);

// Jobs routes
router.use('/jobs', jobsRoutes);

// TODO: Add other module routes here
// router.use('/users', userRoutes);
// etc.

export default router;

