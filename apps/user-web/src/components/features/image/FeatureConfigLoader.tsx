'use client';

import { FeatureConfigProps } from '../../../lib/features/types';
import { ImageResizeConfig } from './resize/ImageResizeConfig';

/**
 * Dynamically loads the appropriate feature config component
 * based on the feature slug
 */
interface FeatureConfigLoaderProps extends FeatureConfigProps {
  featureSlug: string;
}

export function FeatureConfigLoader({ featureSlug, config, onChange, selectedFile }: FeatureConfigLoaderProps) {
  switch (featureSlug) {
    case 'resize':
      return <ImageResizeConfig config={config} onChange={onChange} selectedFile={selectedFile} />;
    
    // Add more features here as they're created:
    // case 'compress':
    //   return <ImageCompressConfig config={config} onChange={onChange} selectedFile={selectedFile} />;
    // case 'crop':
    //   return <ImageCropConfig config={config} onChange={onChange} selectedFile={selectedFile} />;
    
    default:
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Configuration UI for feature "{featureSlug}" is not yet implemented.
          </p>
        </div>
      );
  }
}

