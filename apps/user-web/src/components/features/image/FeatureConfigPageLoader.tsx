'use client';

import { FeatureConfigPageProps } from '../../../lib/features/types';
import { ImageResizeConfigPage } from './resize/ImageResizeConfigPage';
import { ImageCompressConfigPage } from './compress/ImageCompressConfigPage';
import { ImageConvertConfigPage } from './convert/ImageConvertConfigPage';

/**
 * Dynamically loads the appropriate feature config page component
 * based on the feature slug. Each feature can have its own layout.
 */
interface FeatureConfigPageLoaderProps extends FeatureConfigPageProps {
  featureSlug: string;
}

export function FeatureConfigPageLoader({ featureSlug, ...props }: FeatureConfigPageLoaderProps) {
  switch (featureSlug) {
    case 'resize':
      return <ImageResizeConfigPage {...props} />;
    case 'compress':
      return <ImageCompressConfigPage {...props} />;
    case 'convert':
      return <ImageConvertConfigPage {...props} />;
    
    // Add more features here as they're created:
    // case 'crop':
    //   return <ImageCropConfigPage {...props} />;
    
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

