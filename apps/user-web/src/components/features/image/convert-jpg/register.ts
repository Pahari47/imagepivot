import { registerFeatureHandler } from '../../../../lib/features/feature-registry';
import { FeatureHandler } from '../../../../lib/features/types';
import { ConvertJpgConfig } from './ImageConvertJpgConfig';

/**
 * Register the convert-jpg feature handler
 */
export function registerConvertJpgFeature(): void {
  const handler: FeatureHandler = {
    defaultConfig: {
      format: undefined,
      conversionType: 'to',
    },

    validate: (config: Record<string, unknown>): string | null => {
      const convertConfig = config as ConvertJpgConfig;
      // For "Convert To JPG", format is auto-set to JPG
      // For "Convert From JPG", format must be selected
      if (convertConfig.conversionType === 'from' && !convertConfig.format) {
        return 'Please select an output format';
      }
      return null;
    },

    buildParams: (config: Record<string, unknown>): Record<string, unknown> => {
      const convertConfig = config as ConvertJpgConfig;
      const params: Record<string, unknown> = {};
      
      // For "Convert To JPG", always set format to jpg
      if (convertConfig.conversionType === 'to') {
        params.format = 'jpg';
      } else if (convertConfig.format) {
        params.format = convertConfig.format;
      }
      
      if (convertConfig.conversionType) {
        params.conversionType = convertConfig.conversionType;
      }
      
      console.log('[CONVERT-JPG] buildParams:', { config, params });
      return params;
    },

    getApiSlug: (featureSlug: string): string => {
      return `image.${featureSlug}`;
    },
  };

  registerFeatureHandler('convert-jpg', handler);
}

