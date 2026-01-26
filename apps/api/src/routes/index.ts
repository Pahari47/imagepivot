import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
router.use('/auth', authRoutes);

// TODO: Add other module routes here
// router.use('/users', userRoutes);
// router.use('/orgs', orgRoutes);
// etc.

export default router;

