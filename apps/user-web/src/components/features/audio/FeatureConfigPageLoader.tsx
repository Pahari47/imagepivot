'use client';

import { FeatureConfigPageProps } from '../../../lib/features/types';
import { AudioTrimConfigPage } from './trim/AudioTrimConfigPage';
import { AudioConvertConfigPage } from './convert/AudioConvertConfigPage';

/**
 * Dynamically loads the appropriate feature config page component
 * based on the feature slug. Each feature can have its own layout.
 */
interface FeatureConfigPageLoaderProps extends FeatureConfigPageProps {
  featureSlug: string;
}

export function AudioFeatureConfigPageLoader({ featureSlug, ...props }: FeatureConfigPageLoaderProps) {
  switch (featureSlug) {
    case 'trim':
      return <AudioTrimConfigPage {...props} />;
    case 'convert':
      return <AudioConvertConfigPage {...props} />;
    
    // Add more features here as they're created:
    // case 'compress':
    //   return <AudioCompressConfigPage {...props} />;
    // case 'normalize':
    //   return <AudioNormalizeConfigPage {...props} />;
    // case 'metadata':
    //   return <AudioMetadataConfigPage {...props} />;
    
    default:
      return (
        <div className="p-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-sm text-yellow-800">
              Configuration page for feature "{featureSlug}" is not yet implemented.
            </p>
          </div>
        </div>
      );
  }
}

