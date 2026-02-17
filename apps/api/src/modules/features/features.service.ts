import { prisma } from '../../prisma/client';
import { MediaType } from '@prisma/client';
import { NotFoundError } from '../../libs/errors';

export interface FeatureResponse {
  id: string;
  slug: string;
  title: string;
  mediaType: MediaType;
  isEnabled: boolean;
  configSchema: any;
  createdAt: Date;
  updatedAt: Date;
}

export class FeaturesService {
  async getFeaturesByMediaType(mediaType: MediaType): Promise<FeatureResponse[]> {
    const features = await prisma.feature.findMany({
      where: {
        mediaType,
        isEnabled: true,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        mediaType: true,
        isEnabled: true,
        configSchema: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        title: 'asc',
      },
    });

    return features;
  }

  async getFeatureBySlug(slug: string): Promise<FeatureResponse> {
    const feature = await prisma.feature.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        mediaType: true,
        isEnabled: true,
        configSchema: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!feature) {
      throw new NotFoundError(`Feature not found: ${slug}`);
    }

    return feature;
  }

  async getAllFeatures(): Promise<FeatureResponse[]> {
    const features = await prisma.feature.findMany({
      where: {
        isEnabled: true,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        mediaType: true,
        isEnabled: true,
        configSchema: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { mediaType: 'asc' },
        { title: 'asc' },
      ],
    });

    return features;
  }
}

export const featuresService = new FeaturesService();

