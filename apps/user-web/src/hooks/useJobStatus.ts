'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api/client';

export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Job {
  id: string;
  status: JobStatus;
  params: any;
  inputSizeMb: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
  files: Array<{
    id: string;
    kind: string;
    key: string;
    mimeType: string;
    sizeMb: number;
  }>;
  feature: {
    slug: string;
    title: string;
    mediaType: string;
  };
}

interface UseJobStatusOptions {
  jobId: string | null;
  pollInterval?: number;
  enabled?: boolean;
}

export function useJobStatus({ jobId, pollInterval = 2000, enabled = true }: UseJobStatusOptions) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getJob(jobId);
      if (response.success && response.data?.data) {
        const jobData = response.data.data;
        console.log(`[FRONTEND] Job status poll: jobId=${jobId}, status=${jobData.status}`);
        setJob(jobData);
      } else {
        console.error(`[FRONTEND] Failed to fetch job ${jobId}:`, response.error);
        setError(response.error || 'Failed to fetch job status');
      }
    } catch (err) {
      console.error(`[FRONTEND] Error fetching job ${jobId}:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [jobId, enabled]);

  useEffect(() => {
    if (!jobId || !enabled) return;

    fetchJob();

    const interval = setInterval(() => {
      fetchJob();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [jobId, enabled, pollInterval, fetchJob]);

  const isCompleted = job?.status === 'COMPLETED';
  const isFailed = job?.status === 'FAILED';
  const isProcessing = job?.status === 'PROCESSING' || job?.status === 'QUEUED';
  const shouldStopPolling = isCompleted || isFailed;

  useEffect(() => {
    if (shouldStopPolling) {
      return;
    }
  }, [shouldStopPolling]);

  return {
    job,
    loading,
    error,
    isCompleted,
    isFailed,
    isProcessing,
    refetch: fetchJob,
  };
}

