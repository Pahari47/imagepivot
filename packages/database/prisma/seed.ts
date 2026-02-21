import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient, MediaType } from '@prisma/client';

// Load .env from project root
// When script runs: cwd is packages/database, so ../../.env is the root .env file
const rootDir = resolve(process.cwd(), '../..');
const envPath = resolve(rootDir, '.env');

const result = config({ path: envPath, override: false });

if (result.error) {
  console.warn(`Warning: Could not load .env from ${envPath}:`, result.error.message);
}

// Check if DATABASE_URL is set (either from .env or environment)
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  console.error(`Tried loading from: ${envPath}`);
  console.error('Current working directory:', process.cwd());
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding features...');

  const features = [
    {
      slug: 'image.resize',
      title: 'Image Resize',
      mediaType: MediaType.IMAGE,
      isEnabled: true,
      configSchema: {
        type: 'object',
        properties: {
          width: {
            type: 'number',
            description: 'Target width in pixels',
            minimum: 1,
            maximum: 10000,
          },
          height: {
            type: 'number',
            description: 'Target height in pixels',
            minimum: 1,
            maximum: 10000,
          },
          maintainAspect: {
            type: 'boolean',
            description: 'Maintain aspect ratio when only one dimension is provided',
            default: true,
          },
          format: {
            type: 'string',
            enum: ['jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp'],
            description: 'Output image format',
          },
          quality: {
            type: 'number',
            description: 'Quality for JPEG/WebP (1-100)',
            minimum: 1,
            maximum: 100,
            default: 95,
          },
        },
        required: [],
        anyOf: [
          { required: ['width'] },
          { required: ['height'] },
        ],
      },
    },
    {
      slug: 'image.compress',
      title: 'Image Compress',
      mediaType: MediaType.IMAGE,
      isEnabled: true,
      configSchema: {
        type: 'object',
        properties: {
          quality: {
            type: 'number',
            description: 'Quality for JPEG/WebP (1-100). Lower values = smaller file size',
            minimum: 1,
            maximum: 100,
            default: 85,
          },
          format: {
            type: 'string',
            enum: ['jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp'],
            description: 'Output image format (optional, keeps original if not specified)',
          },
          optimize: {
            type: 'boolean',
            description: 'Enable image optimization',
            default: true,
          },
        },
        required: [],
      },
    },
    {
      slug: 'image.convert',
      title: 'Convert PNG',
      mediaType: MediaType.IMAGE,
      isEnabled: true,
      configSchema: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['jpeg', 'jpg', 'png', 'svg', 'webp', 'gif', 'bmp', 'tif', 'tiff', 'ico', 'heic', 'avif'],
            description: 'Output image format',
          },
          conversionType: {
            type: 'string',
            enum: ['to', 'from'],
            description: 'Conversion type: "to" for converting to PNG, "from" for converting from PNG',
            default: 'to',
          },
        },
        required: ['format'],
      },
    },
    {
      slug: 'image.convert-jpg',
      title: 'Convert JPG',
      mediaType: MediaType.IMAGE,
      isEnabled: true,
      configSchema: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['jpeg', 'jpg', 'png', 'svg', 'webp', 'gif', 'bmp', 'tif', 'tiff', 'ico', 'heic', 'avif'],
            description: 'Output image format',
          },
          conversionType: {
            type: 'string',
            enum: ['to', 'from'],
            description: 'Conversion type: "to" for converting to JPG, "from" for converting from JPG',
            default: 'to',
          },
        },
        required: ['format'],
      },
    },
    {
      slug: 'image.quality',
      title: 'Image Quality Control',
      mediaType: MediaType.IMAGE,
      isEnabled: true,
      configSchema: {
        type: 'object',
        properties: {
          quality: {
            type: 'number',
            description: 'Quality level (1-100). Higher values preserve more detail but result in larger file sizes',
            minimum: 1,
            maximum: 100,
            default: 95,
          },
          format: {
            type: 'string',
            enum: ['jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp'],
            description: 'Output image format (optional, keeps original if not specified)',
          },
          optimize: {
            type: 'boolean',
            description: 'Enable image optimization',
            default: true,
          },
        },
        required: ['quality'],
      },
    },
    {
      slug: 'audio.trim',
      title: 'Audio Trim',
      mediaType: MediaType.AUDIO,
      isEnabled: true,
      configSchema: {
        type: 'object',
        properties: {
          startTime: {
            type: 'number',
            description: 'Start time in seconds',
            minimum: 0,
          },
          endTime: {
            type: 'number',
            description: 'End time in seconds',
            minimum: 0,
          },
          format: {
            type: 'string',
            enum: ['mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac', 'webm', 'opus'],
            description: 'Output audio format (optional, keeps original if not specified)',
          },
        },
        required: ['startTime', 'endTime'],
      },
    },
    {
      slug: 'audio.convert',
      title: 'Audio Convert',
      mediaType: MediaType.AUDIO,
      isEnabled: true,
      configSchema: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'alac', 'm4a'],
            description: 'Target audio format',
          },
          quality: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'custom'],
            description: 'Quality preset for lossy formats (low=96k, medium=192k, high=320k)',
            default: 'medium',
          },
          bitrate: {
            type: 'number',
            description: 'Custom bitrate in kbps (only used when quality is custom)',
            minimum: 64,
            maximum: 320,
          },
        },
        required: ['format'],
      },
    },
    {
      slug: 'audio.compress',
      title: 'Audio Compress',
      mediaType: MediaType.AUDIO,
      isEnabled: true,
      configSchema: {
        type: 'object',
        properties: {
          bitrate: {
            type: 'number',
            description: 'Target bitrate in kbps (64-320)',
            minimum: 64,
            maximum: 320,
            default: 192,
          },
          vbr: {
            type: 'boolean',
            description: 'Use Variable Bitrate (VBR) for better quality at same file size',
            default: false,
          },
          sampleRate: {
            type: 'number',
            description: 'Target sample rate in Hz (8000, 11025, 16000, 22050, 44100, 48000). Lower values reduce file size',
            enum: [8000, 11025, 16000, 22050, 44100, 48000],
          },
          format: {
            type: 'string',
            enum: ['mp3', 'aac', 'ogg', 'm4a'],
            description: 'Output format for compression (lossy formats only)',
            default: 'mp3',
          },
        },
        required: ['bitrate'],
      },
    },
    {
      slug: 'audio.normalize',
      title: 'Audio Normalize',
      mediaType: MediaType.AUDIO,
      isEnabled: true,
      configSchema: {
        type: 'object',
        properties: {
          targetLevel: {
            type: 'number',
            description: 'Target loudness level in LUFS (Loudness Units relative to Full Scale). Default: -16 LUFS (industry standard)',
            minimum: -23,
            maximum: -12,
            default: -16,
          },
          format: {
            type: 'string',
            enum: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
            description: 'Output format (optional, keeps original if not specified)',
          },
        },
        required: [],
      },
    },
  ];

  for (const feature of features) {
    const existing = await prisma.feature.findUnique({
      where: { slug: feature.slug },
    });

    if (existing) {
      console.log(`Feature ${feature.slug} already exists, skipping...`);
      await prisma.feature.update({
        where: { slug: feature.slug },
        data: feature,
      });
      console.log(`Updated feature: ${feature.slug}`);
    } else {
      await prisma.feature.create({
        data: feature,
      });
      console.log(`Created feature: ${feature.slug}`);
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

