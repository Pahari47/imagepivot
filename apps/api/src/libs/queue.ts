import { createClient } from 'redis';
import { env } from '../config/env';
import { logger } from './logger';

export const JOB_QUEUE_KEY_V1 = 'imagepivot:jobs:v1';

type RedisClient = ReturnType<typeof createClient>;
let redisClient: RedisClient | null = null;

async function getRedisClient(): Promise<RedisClient> {
  if (redisClient) return redisClient;

  const client = createClient({
    url: env.REDIS_URL,
  });

  client.on('error', (err) => {
    logger.error('Redis client error:', err);
  });

  await client.connect();
  redisClient = client;
  return client;
}

export interface QueueJobV1 {
  version: '1.1';
  jobId: string;
  userId: string;
  orgId: string;
  mediaType: 'IMAGE' | 'AUDIO' | 'VIDEO';
  featureSlug: string;
  input: {
    storage: 'R2';
    bucket: string;
    key: string;
    sizeBytes: number;
    mimeType: string;
  };
  params: Record<string, unknown>;
  metadata: {
    utmSource: string | null;
    utmCampaign: string | null;
    priority: number;
    queuedAt: string; // ISO8601
    attempt: number;
    maxAttempts: number;
    idempotencyKey: string | null;
  };
}

export async function enqueueJobV1(payload: QueueJobV1): Promise<void> {
  const client = await getRedisClient();
  const payloadStr = JSON.stringify(payload);
  
  logger.debug('[QUEUE] Enqueuing job', {
    jobId: payload.jobId,
    featureSlug: payload.featureSlug,
    mediaType: payload.mediaType,
    queueKey: JOB_QUEUE_KEY_V1,
  });
  
  await client.rPush(JOB_QUEUE_KEY_V1, payloadStr);
  
  logger.info('[QUEUE] Job enqueued', {
    jobId: payload.jobId,
    queueKey: JOB_QUEUE_KEY_V1,
    queueLength: await client.lLen(JOB_QUEUE_KEY_V1),
  });
}


