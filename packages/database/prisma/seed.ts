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

