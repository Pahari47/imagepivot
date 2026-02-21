import { registerFeatureHandler } from '../../../../lib/features/feature-registry';
import { FeatureHandler } from '../../../../lib/features/types';
import { TrimConfig } from './AudioTrimConfig';

/**
 * Register the trim feature handler
 */
export function registerTrimFeature(): void {
  const handler: FeatureHandler = {
    defaultConfig: {
      startTime: 0,
      endTime: 10,
    },

    validate: (config: Record<string, unknown>): string | null => {
      const trimConfig = config as TrimConfig;
      
      if (trimConfig.startTime === undefined || trimConfig.startTime === null) {
        return 'Start time is required';
      }
      
      if (trimConfig.endTime === undefined || trimConfig.endTime === null) {
        return 'End time is required';
      }
      
      if (trimConfig.startTime < 0) {
        return 'Start time must be >= 0';
      }
      
      if (trimConfig.endTime <= trimConfig.startTime) {
        return 'End time must be greater than start time';
      }
      
      return null;
    },

    buildParams: (config: Record<string, unknown>): Record<string, unknown> => {
      const trimConfig = config as TrimConfig;
      const params: Record<string, unknown> = {};
      
      params.startTime = trimConfig.startTime;
      params.endTime = trimConfig.endTime;
      
      if (trimConfig.format) {
        params.format = trimConfig.format;
      }
      
      return params;
    },

    getApiSlug: (featureSlug: string): string => {
      return `audio.${featureSlug}`;
    },
  };

  registerFeatureHandler('trim', handler);
}

