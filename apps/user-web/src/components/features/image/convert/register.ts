import { registerFeatureHandler } from '../../../../lib/features/feature-registry';
import { FeatureHandler } from '../../../../lib/features/types';
import { ConvertConfig } from './ImageConvertConfig';

/**
 * Register the convert feature handler
 */
export function registerConvertFeature(): void {
  const handler: FeatureHandler = {
    defaultConfig: {
      format: undefined,
      conversionType: 'to',
    },

    validate: (config: Record<string, unknown>): string | null => {
      const convertConfig = config as ConvertConfig;
      // For "Convert To PNG", format is auto-set to PNG
      // For "Convert From PNG", format must be selected
      if (convertConfig.conversionType === 'from' && !convertConfig.format) {
        return 'Please select an output format';
      }
      return null;
    },

    buildParams: (config: Record<string, unknown>): Record<string, unknown> => {
      const convertConfig = config as ConvertConfig;
      const params: Record<string, unknown> = {};
      
      if (convertConfig.format) {
        params.format = convertConfig.format;
      }
      if (convertConfig.conversionType) {
        params.conversionType = convertConfig.conversionType;
      }
      
      return params;
    },

    getApiSlug: (featureSlug: string): string => {
      return `image.${featureSlug}`;
    },
  };

  registerFeatureHandler('convert', handler);
}

