import { registerFeatureHandler } from '../../../../lib/features/feature-registry';
import { FeatureHandler } from '../../../../lib/features/types';
import { MetadataConfig } from './AudioMetadataConfig';

/**
 * Register the metadata feature handler
 */
export function registerMetadataFeature(): void {
  const handler: FeatureHandler = {
    defaultConfig: {
      title: undefined,
      artist: undefined,
      album: undefined,
      year: undefined,
      genre: undefined,
      trackNumber: undefined,
      coverArt: undefined,
    },

    validate: (config: Record<string, unknown>): string | null => {
      const metadataConfig = config as MetadataConfig;
      
      if (metadataConfig.year !== undefined) {
        if (typeof metadataConfig.year !== 'number' || metadataConfig.year < 1900 || metadataConfig.year > 2100) {
          return 'Year must be between 1900 and 2100';
        }
      }

      if (metadataConfig.trackNumber !== undefined) {
        if (typeof metadataConfig.trackNumber !== 'number' || metadataConfig.trackNumber < 1) {
          return 'Track number must be >= 1';
        }
      }

      // Check if at least one field is provided
      const hasAnyField = 
        metadataConfig.title ||
        metadataConfig.artist ||
        metadataConfig.album ||
        metadataConfig.year ||
        metadataConfig.genre ||
        metadataConfig.trackNumber ||
        metadataConfig.coverArt;
      
      if (!hasAnyField) {
        return 'At least one metadata field or cover art must be provided';
      }
      
      return null;
    },

    buildParams: (config: Record<string, unknown>): Record<string, unknown> => {
      const metadataConfig = config as MetadataConfig;
      const params: Record<string, unknown> = {};
      
      if (metadataConfig.title) {
        params.title = metadataConfig.title;
      }
      if (metadataConfig.artist) {
        params.artist = metadataConfig.artist;
      }
      if (metadataConfig.album) {
        params.album = metadataConfig.album;
      }
      if (metadataConfig.year) {
        params.year = metadataConfig.year;
      }
      if (metadataConfig.genre) {
        params.genre = metadataConfig.genre;
      }
      if (metadataConfig.trackNumber) {
        params.trackNumber = metadataConfig.trackNumber;
      }
      if (metadataConfig.coverArt) {
        params.coverArt = metadataConfig.coverArt;
      }
      
      return params;
    },

    getApiSlug: (featureSlug: string): string => {
      return `audio.${featureSlug}`;
    },
  };

  registerFeatureHandler('metadata', handler);
}

