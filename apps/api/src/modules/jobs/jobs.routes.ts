import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { jobsController } from './jobs.controller';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../libs/errors';

const router = Router();

function workerAuth(req: any, _res: any, next: any) {
  if (!env.WORKER_API_KEY) {
    return next(new UnauthorizedError('WORKER_API_KEY not configured'));
  }

  const key = (req.headers['x-worker-api-key'] as string | undefined) || '';
  if (!key || key !== env.WORKER_API_KEY) {
    return next(new UnauthorizedError('Invalid worker api key'));
  }

  next();
}

// Worker/internal callbacks (no user auth)
router.post('/internal/:jobId/status', workerAuth, jobsController.workerUpdateStatus.bind(jobsController));

// All other job routes require authentication
router.use(authMiddleware);

router.post('/', jobsController.createJob.bind(jobsController));
router.get('/', jobsController.listJobs.bind(jobsController));
router.get('/:jobId', jobsController.getJob.bind(jobsController));
router.get('/:jobId/download', jobsController.getJobDownloadUrl.bind(jobsController));
router.post('/:jobId/cancel', jobsController.cancelJob.bind(jobsController));

export default router;


