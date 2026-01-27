import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env';
import { ValidationError } from '../../libs/errors';
import { quotaService } from '../quota/quota.service';
import { orgService } from '../orgs/org.service';
import { randomUUID } from 'crypto';

// Allowed MIME types for uploads
const ALLOWED_MIME_TYPES = {
  image: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
  ],
  audio: [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/flac',
    'audio/webm',
  ],
  video: [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/ogg',
  ],
};

// Max file sizes (in MB)
const MAX_FILE_SIZES = {
  image: 500, // 500MB
  audio: 1000, // 1GB
  video: 5000, // 5GB
};

interface GeneratePresignedUrlInput {
  userId: string;
  orgId: string;
  fileName: string;
  fileSize: number; // in bytes
  mimeType: string;
  mediaType: 'image' | 'audio' | 'video';
}

class UploadService {
  private s3Client: S3Client | null = null;

  /**
   * Initialize S3 client for R2
   */
  private getS3Client(): S3Client {
    if (this.s3Client) {
      return this.s3Client;
    }

    if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
      throw new Error('R2 credentials not configured');
    }

    this.s3Client = new S3Client({
      region: 'auto', // R2 uses 'auto' region
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    return this.s3Client;
  }

  /**
   * Validate file before generating presigned URL
   */
  private validateFile(
    fileName: string,
    fileSize: number,
    mimeType: string,
    mediaType: 'image' | 'audio' | 'video'
  ): void {
    // Validate MIME type
    const allowedTypes = ALLOWED_MIME_TYPES[mediaType];
    if (!allowedTypes.includes(mimeType)) {
      throw new ValidationError(
        `Invalid file type. Allowed types for ${mediaType}: ${allowedTypes.join(', ')}`
      );
    }

    // Validate file size
    const maxSizeBytes = MAX_FILE_SIZES[mediaType] * 1024 * 1024; // Convert MB to bytes
    if (fileSize > maxSizeBytes) {
      throw new ValidationError(
        `File size exceeds maximum. Maximum size for ${mediaType}: ${MAX_FILE_SIZES[mediaType]}MB`
      );
    }

    if (fileSize <= 0) {
      throw new ValidationError('File size must be greater than 0');
    }
  }

  /**
   * Generate presigned upload URL
   * Validates quota and file before generating URL
   */
  async generatePresignedUploadUrl(input: GeneratePresignedUrlInput): Promise<{
    uploadUrl: string;
    key: string;
    expiresIn: number;
  }> {
    const { userId, orgId, fileName, fileSize, mimeType, mediaType } = input;

    // Validate user has access to org
    await orgService.ensureOrgAccess(userId, orgId);

    // Validate file
    this.validateFile(fileName, fileSize, mimeType, mediaType);

    // Convert file size to MB for quota check
    const fileSizeMb = Math.ceil(fileSize / (1024 * 1024));

    // Validate quota (soft check at presign time)
    await quotaService.validateQuota(userId, fileSizeMb);

    // Generate unique key for file
    const uniqueId = randomUUID();
    const key = `uploads/${orgId}/${uniqueId}/${fileName}`;

    // Generate presigned URL (15 minutes expiration)
    const client = this.getS3Client();
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ContentType: mimeType,
      // Add metadata for tracking
      Metadata: {
        userId,
        orgId,
        mediaType,
        originalFileName: fileName,
      },
    });

    const expiresIn = 15 * 60; // 15 minutes in seconds
    const uploadUrl = await getSignedUrl(client, command, { expiresIn });

    return {
      uploadUrl,
      key,
      expiresIn,
    };
  }

  /**
   * Generate presigned download URL (for completed jobs)
   */
  async generatePresignedDownloadUrl(key: string, expiresIn: number = 600): Promise<string> {
    const client = this.getS3Client();

    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    });

    const downloadUrl = await getSignedUrl(client, command, { expiresIn });
    return downloadUrl;
  }
}

export const uploadService = new UploadService();

