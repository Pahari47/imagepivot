import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { createJobSchema } from './jobs.validation';
import { jobsService } from './jobs.service';
import { logger } from '../../libs/logger';
import { JobStatus } from '@prisma/client';
import { z } from 'zod';

const workerStatusSchema = z.object({
  status: z.nativeEnum(JobStatus),
  error: z.string().optional(),
  output: z
    .object({
      key: z.string().min(1),
      mimeType: z.string().min(1).optional(),
      sizeBytes: z.number().int().positive().optional(),
    })
    .optional(),
  workerId: z.string().min(1).optional(),
});

export class JobsController {
  /**
   * POST /api/jobs
   */
  async createJob(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.userId;

      const parsed = createJobSchema.parse(req.body);
      const idempotencyKey =
        (req.headers['idempotency-key'] as string | undefined) ||
        (req.headers['x-idempotency-key'] as string | undefined) ||
        null;

      const job = await jobsService.createJob(userId, parsed, idempotencyKey);

      res.status(201).json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/jobs/:jobId
   */
  async getJob(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.userId;
      const { jobId } = req.params;

      logger.debug('[JOB] Fetching job status', { jobId, userId });
      const job = await jobsService.getJobForUser(userId, jobId);
      logger.debug('[JOB] Job status retrieved', { jobId, status: job.status });
      res.json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/jobs?status=QUEUED
   */
  async listJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.userId;

      const status = req.query.status as string | undefined;
      const parsedStatus =
        status && Object.values(JobStatus).includes(status as JobStatus)
          ? (status as JobStatus)
          : undefined;

      const jobs = await jobsService.listJobsForUser(userId, parsedStatus);
      res.json({ success: true, data: jobs });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/jobs/:jobId/cancel
   */
  async cancelJob(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.userId;
      const { jobId } = req.params;

      const job = await jobsService.cancelJobForUser(userId, jobId);
      res.json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/jobs/internal/:jobId/status
   * Header: x-worker-api-key
   */
  async workerUpdateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.params;
      const parsed = workerStatusSchema.parse(req.body);

      const job = await jobsService.updateJobStatusFromWorker(jobId, parsed);
      res.json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/jobs/:jobId/download
   */
  async getJobDownloadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.userId;
      const { jobId } = req.params;
      const expiresIn = req.query.expiresIn ? Number(req.query.expiresIn) : 600;

      const downloadUrl = await jobsService.getJobDownloadUrl(userId, jobId, expiresIn);
      res.json({ success: true, data: { downloadUrl, expiresIn } });
    } catch (error) {
      next(error);
    }
  }
}

export const jobsController = new JobsController();


