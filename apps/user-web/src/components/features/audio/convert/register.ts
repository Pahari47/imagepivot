import { registerFeatureHandler } from '../../../../lib/features/feature-registry';
import { FeatureHandler } from '../../../../lib/features/types';
import { ConvertConfig } from './AudioConvertConfig';

/**
 * Register the convert feature handler
 */
export function registerConvertFeature(): void {
  const handler: FeatureHandler = {
    defaultConfig: {
      format: '',
      quality: 'medium',
    },

    validate: (config: Record<string, unknown>): string | null => {
      const convertConfig = config as ConvertConfig;
      
      if (!convertConfig.format) {
        return 'Output format is required';
      }
      
      const lossyFormats = ['mp3', 'aac', 'ogg'];
      const isLossy = lossyFormats.includes(convertConfig.format.toLowerCase());
      
      if (isLossy && convertConfig.quality === 'custom' && !convertConfig.bitrate) {
        return 'Custom bitrate is required when quality is set to custom';
      }
      
      if (convertConfig.bitrate !== undefined) {
        if (convertConfig.bitrate < 64 || convertConfig.bitrate > 320) {
          return 'Bitrate must be between 64 and 320 kbps';
        }
      }
      
      return null;
    },

    buildParams: (config: Record<string, unknown>): Record<string, unknown> => {
      const convertConfig = config as ConvertConfig;
      const params: Record<string, unknown> = {};
      
      params.format = convertConfig.format;
      
      const lossyFormats = ['mp3', 'aac', 'ogg'];
      const isLossy = lossyFormats.includes((convertConfig.format || '').toLowerCase());
      
      if (isLossy) {
        params.quality = convertConfig.quality || 'medium';
        
        if (convertConfig.quality === 'custom' && convertConfig.bitrate) {
          params.bitrate = convertConfig.bitrate;
        }
      }
      
      return params;
    },

    getApiSlug: (featureSlug: string): string => {
      return `audio.${featureSlug}`;
    },
  };

  registerFeatureHandler('convert', handler);
}





