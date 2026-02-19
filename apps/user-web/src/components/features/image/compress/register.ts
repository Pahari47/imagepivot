import { registerFeatureHandler } from '../../../../lib/features/feature-registry';
import { FeatureHandler } from '../../../../lib/features/types';
import { CompressConfig } from './ImageCompressConfig';

/**
 * Register the compress feature handler
 */
export function registerCompressFeature(): void {
  const handler: FeatureHandler = {
    defaultConfig: {
      quality: 85,
      optimize: true,
    },

    validate: (config: Record<string, unknown>): string | null => {
      const compressConfig = config as CompressConfig;
      if (compressConfig.quality !== undefined) {
        if (compressConfig.quality < 1 || compressConfig.quality > 100) {
          return 'Quality must be between 1 and 100';
        }
      }
      return null;
    },

    buildParams: (config: Record<string, unknown>): Record<string, unknown> => {
      const compressConfig = config as CompressConfig;
      const params: Record<string, unknown> = {};
      
      if (compressConfig.quality !== undefined) {
        params.quality = compressConfig.quality;
      }
      if (compressConfig.format) {
        params.format = compressConfig.format;
      }
      params.optimize = compressConfig.optimize ?? true;
      
      return params;
    },

    getApiSlug: (featureSlug: string): string => {
      return `image.${featureSlug}`;
    },
  };

  registerFeatureHandler('compress', handler);
}

