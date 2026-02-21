import { registerFeatureHandler } from '../../../../lib/features/feature-registry';
import { FeatureHandler } from '../../../../lib/features/types';
import { QualityConfig } from './ImageQualityConfig';

/**
 * Register the quality control feature handler
 */
export function registerQualityFeature(): void {
  const handler: FeatureHandler = {
    defaultConfig: {
      quality: 95,
      optimize: true,
    },

    validate: (config: Record<string, unknown>): string | null => {
      const qualityConfig = config as QualityConfig;
      if (qualityConfig.quality === undefined) {
        return 'Quality is required';
      }
      if (qualityConfig.quality < 1 || qualityConfig.quality > 100) {
        return 'Quality must be between 1 and 100';
      }
      return null;
    },

    buildParams: (config: Record<string, unknown>): Record<string, unknown> => {
      const qualityConfig = config as QualityConfig;
      const params: Record<string, unknown> = {};
      
      if (qualityConfig.quality !== undefined) {
        params.quality = qualityConfig.quality;
      }
      if (qualityConfig.format) {
        params.format = qualityConfig.format;
      }
      params.optimize = qualityConfig.optimize ?? true;
      
      return params;
    },

    getApiSlug: (featureSlug: string): string => {
      return `image.${featureSlug}`;
    },
  };

  registerFeatureHandler('quality', handler);
}





