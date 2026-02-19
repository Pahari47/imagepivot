import { registerFeatureHandler } from '../../../../lib/features/feature-registry';
import { FeatureHandler } from '../../../../lib/features/types';
import { ResizeConfig } from './ImageResizeConfig';

/**
 * Register the resize feature handler
 */
export function registerResizeFeature(): void {
  const handler: FeatureHandler = {
    defaultConfig: {
      maintainAspect: true,
      quality: 95,
    },

    validate: (config: Record<string, unknown>): string | null => {
      const resizeConfig = config as ResizeConfig;
      if (!resizeConfig.width && !resizeConfig.height) {
        return 'At least one of width or height must be provided';
      }
      return null;
    },

    buildParams: (config: Record<string, unknown>): Record<string, unknown> => {
      const resizeConfig = config as ResizeConfig;
      const params: Record<string, unknown> = {};
      
      if (resizeConfig.width) params.width = resizeConfig.width;
      if (resizeConfig.height) params.height = resizeConfig.height;
      params.maintainAspect = resizeConfig.maintainAspect ?? true;
      if (resizeConfig.format) params.format = resizeConfig.format;
      if (resizeConfig.quality) params.quality = resizeConfig.quality;
      
      return params;
    },

    getApiSlug: (featureSlug: string): string => {
      return `image.${featureSlug}`;
    },
  };

  registerFeatureHandler('resize', handler);
}

