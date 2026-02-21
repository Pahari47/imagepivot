import { registerFeatureHandler } from '../../../../lib/features/feature-registry';
import { FeatureHandler } from '../../../../lib/features/types';
import { CompressConfig } from './AudioCompressConfig';

/**
 * Register the compress feature handler
 */
export function registerCompressFeature(): void {
  const handler: FeatureHandler = {
    defaultConfig: {
      bitrate: 192,
      vbr: false,
      sampleRate: undefined,
      format: 'mp3',
    },

    validate: (config: Record<string, unknown>): string | null => {
      const compressConfig = config as CompressConfig;
      
      if (!compressConfig.bitrate) {
        return 'Bitrate is required';
      }

      if (compressConfig.bitrate < 64 || compressConfig.bitrate > 320) {
        return 'Bitrate must be between 64 and 320 kbps';
      }

      if (compressConfig.sampleRate) {
        const validSampleRates = [8000, 11025, 16000, 22050, 44100, 48000];
        if (!validSampleRates.includes(compressConfig.sampleRate)) {
          return `Sample rate must be one of: ${validSampleRates.join(', ')}`;
        }
      }

      if (compressConfig.format) {
        const validFormats = ['mp3', 'aac', 'ogg', 'm4a'];
        if (!validFormats.includes(compressConfig.format)) {
          return `Format must be one of: ${validFormats.join(', ')}`;
        }
      }
      
      return null;
    },

    buildParams: (config: Record<string, unknown>): Record<string, unknown> => {
      const compressConfig = config as CompressConfig;
      const params: Record<string, unknown> = {
        bitrate: compressConfig.bitrate,
      };
      
      if (compressConfig.vbr !== undefined) {
        params.vbr = compressConfig.vbr;
      }

      if (compressConfig.sampleRate !== undefined) {
        params.sampleRate = compressConfig.sampleRate;
      }

      if (compressConfig.format) {
        params.format = compressConfig.format;
      }
      
      return params;
    },

    getApiSlug: (featureSlug: string): string => {
      return `audio.${featureSlug}`;
    },
  };

  registerFeatureHandler('compress', handler);
}

