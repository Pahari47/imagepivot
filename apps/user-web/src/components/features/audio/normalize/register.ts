import { registerFeatureHandler } from '../../../../lib/features/feature-registry';
import { FeatureHandler } from '../../../../lib/features/types';
import { NormalizeConfig } from './AudioNormalizeConfig';

/**
 * Register the normalize feature handler
 */
export function registerNormalizeFeature(): void {
  const handler: FeatureHandler = {
    defaultConfig: {
      targetLevel: -16,
      format: undefined,
    },

    validate: (config: Record<string, unknown>): string | null => {
      const normalizeConfig = config as NormalizeConfig;
      
      if (normalizeConfig.targetLevel !== undefined) {
        if (normalizeConfig.targetLevel < -23 || normalizeConfig.targetLevel > -12) {
          return 'Target level must be between -23 and -12 LUFS';
        }
      }

      if (normalizeConfig.format) {
        const validFormats = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
        if (!validFormats.includes(normalizeConfig.format)) {
          return `Format must be one of: ${validFormats.join(', ')}`;
        }
      }
      
      return null;
    },

    buildParams: (config: Record<string, unknown>): Record<string, unknown> => {
      const normalizeConfig = config as NormalizeConfig;
      const params: Record<string, unknown> = {};
      
      if (normalizeConfig.targetLevel !== undefined) {
        params.targetLevel = normalizeConfig.targetLevel;
      }

      if (normalizeConfig.format) {
        params.format = normalizeConfig.format;
      }
      
      return params;
    },

    getApiSlug: (featureSlug: string): string => {
      return `audio.${featureSlug}`;
    },
  };

  registerFeatureHandler('normalize', handler);
}


