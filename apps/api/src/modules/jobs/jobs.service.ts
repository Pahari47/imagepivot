import { prisma } from '../../prisma/client';
import { NotFoundError, ValidationError } from '../../libs/errors';
import { orgService } from '../orgs/org.service';
import { quotaService } from '../quota/quota.service';
import { enqueueJobV1 } from '../../libs/queue';
import { env } from '../../config/env';
import type { CreateJobInput } from './jobs.validation';
import { JobStatus, Prisma } from '@prisma/client';

function bytesToMbCeil(sizeBytes: number): number {
  return Math.ceil(sizeBytes / (1024 * 1024));
}

function isPrismaUniqueError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as any).code === 'P2002'
  );
}

export class JobsService {
  async createJob(userId: string, input: CreateJobInput, idempotencyKey: string | null) {
    // Validate user has access to org
    await orgService.ensureOrgAccess(userId, input.orgId);

    const feature = await prisma.feature.findUnique({
      where: { slug: input.featureSlug },
      select: { id: true, slug: true, mediaType: true, isEnabled: true },
    });

    if (!feature) {
      throw new NotFoundError(`Feature not found: ${input.featureSlug}`);
    }

    if (!feature.isEnabled) {
      throw new ValidationError(`Feature is disabled: ${input.featureSlug}`);
    }

    if (input.mediaType && input.mediaType !== feature.mediaType) {
      throw new ValidationError(
        `mediaType mismatch. Feature ${input.featureSlug} is ${feature.mediaType}, got ${input.mediaType}`
      );
    }

    const sizeBytes =
      input.input.sizeBytes ?? Math.round((input.input.sizeMb || 0) * 1024 * 1024);

    const inputSizeMb = bytesToMbCeil(sizeBytes);

    // Hard quota check at job creation time
    await quotaService.validateQuota(userId, inputSizeMb);

    // Idempotency: if key exists, return existing job
    if (idempotencyKey) {
      const existing = await prisma.job.findFirst({
        where: { idempotencyKey, userId },
        include: { files: true },
      });
      if (existing) {
        return existing;
      }
    }

    let job;
    try {
      job = await prisma.job.create({
        data: {
          userId,
          orgId: input.orgId,
          featureId: feature.id,
          status: JobStatus.QUEUED,
          params: input.params as Prisma.JsonObject,
          inputSizeMb,
          attempt: 0,
          maxAttempts: input.maxAttempts,
          idempotencyKey: idempotencyKey || undefined,
          queuedAt: new Date(),
          files: {
            create: {
              kind: 'INPUT',
              mimeType: input.input.mimeType,
              storageProvider: 'R2',
              bucket: env.R2_BUCKET_NAME,
              key: input.input.key,
              sizeMb: inputSizeMb,
            },
          },
        },
        include: { files: true },
      });
    } catch (err) {
      // If idempotencyKey is duplicated due to a race, return the existing job
      if (idempotencyKey && isPrismaUniqueError(err)) {
        const existing = await prisma.job.findFirst({
          where: { idempotencyKey, userId },
          include: { files: true },
        });
        if (existing) return existing;
      }
      throw err;
    }

    // Consume quota (idempotent per job)
    try {
      await quotaService.consumeForJob(userId, job.id, inputSizeMb);
    } catch (err) {
      if (!isPrismaUniqueError(err)) {
        throw err;
      }
    }

    // Push to queue
    try {
      await enqueueJobV1({
        version: '1.1',
        jobId: job.id,
        userId,
        orgId: input.orgId,
        mediaType: feature.mediaType,
        featureSlug: feature.slug,
        input: {
          storage: 'R2',
          bucket: env.R2_BUCKET_NAME,
          key: input.input.key,
          sizeBytes,
          mimeType: input.input.mimeType,
        },
        params: input.params,
        metadata: {
          utmSource: input.utmSource || null,
          utmCampaign: input.utmCampaign || null,
          priority: input.priority,
          queuedAt: new Date().toISOString(),
          attempt: 0,
          maxAttempts: input.maxAttempts,
          idempotencyKey,
        },
      });
    } catch (err) {
      // Mark failed and refund quota (best-effort)
      await prisma.job.update({
        where: { id: job.id },
        data: { status: JobStatus.FAILED, error: 'Failed to enqueue job' },
      });

      try {
        await quotaService.refundForJob(userId, job.id, inputSizeMb);
      } catch (refundErr) {
        // ignore duplicate refunds
        if (!isPrismaUniqueError(refundErr)) {
          throw refundErr;
        }
      }

      throw err;
    }

    return job;
  }

  async getJobForUser(userId: string, jobId: string) {
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId },
      include: { files: true, feature: { select: { slug: true, mediaType: true, title: true } } },
    });
    if (!job) throw new NotFoundError('Job not found');
    return job;
  }

  async listJobsForUser(userId: string, status?: JobStatus) {
    return prisma.job.findMany({
      where: { userId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { feature: { select: { slug: true, mediaType: true, title: true } } },
      take: 50,
    });
  }

  async cancelJobForUser(userId: string, jobId: string) {
    const job = await prisma.job.findFirst({ where: { id: jobId, userId } });
    if (!job) throw new NotFoundError('Job not found');

    if (job.status !== JobStatus.QUEUED && job.status !== JobStatus.PROCESSING) {
      throw new ValidationError(`Job cannot be cancelled from status: ${job.status}`);
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: { status: JobStatus.CANCELLED },
    });

    // Refund on cancel (matches "refund if job fails"; cancel is treated similarly)
    try {
      await quotaService.refundForJob(userId, jobId, job.inputSizeMb);
    } catch (err) {
      if (!isPrismaUniqueError(err)) throw err;
    }

    return updated;
  }

  async updateJobStatusFromWorker(
    jobId: string,
    input: {
      status: JobStatus;
      error?: string;
      output?: { key: string; mimeType?: string; sizeBytes?: number };
      workerId?: string;
    }
  ) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { files: true },
    });
    if (!job) throw new NotFoundError('Job not found');

    if (input.status === JobStatus.PROCESSING) {
      return prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.PROCESSING,
          startedAt: job.startedAt || new Date(),
          workerId: input.workerId,
        },
      });
    }

    if (input.status === JobStatus.COMPLETED) {
      const outputSizeMb = input.output?.sizeBytes
        ? bytesToMbCeil(input.output.sizeBytes)
        : undefined;

      return prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.COMPLETED,
          completedAt: new Date(),
          error: null,
          workerId: input.workerId,
          files: input.output
            ? {
                create: {
                  kind: 'OUTPUT',
                  mimeType: input.output.mimeType,
                  storageProvider: 'R2',
                  bucket: env.R2_BUCKET_NAME,
                  key: input.output.key,
                  sizeMb: outputSizeMb,
                },
              }
            : undefined,
        },
      });
    }

    if (input.status === JobStatus.FAILED || input.status === JobStatus.CANCELLED) {
      const updated = await prisma.job.update({
        where: { id: jobId },
        data: {
          status: input.status,
          completedAt: new Date(),
          error: input.error || (input.status === JobStatus.FAILED ? 'Job failed' : null),
          workerId: input.workerId,
        },
      });

      // Refund quota on failure/cancel (idempotent)
      try {
        await quotaService.refundForJob(updated.userId, updated.id, updated.inputSizeMb);
      } catch (err) {
        if (!isPrismaUniqueError(err)) throw err;
      }

      return updated;
    }

    throw new ValidationError(`Unsupported status update: ${input.status}`);
  }
}

export const jobsService = new JobsService();


