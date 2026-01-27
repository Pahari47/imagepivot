'use client';

import { AuthProviderWrapper } from '../../../components/providers/AuthProviderWrapper';
import { ToolSidebar } from '../../../components/layout/ToolSidebar';
import { ToolHeader } from '../../../components/layout/ToolHeader';
import { UploadArea } from '../../../components/upload/UploadArea';

interface ImageFeaturePageProps {
  params: {
    feature: string;
  };
}

export default function ImageFeaturePage({ params }: ImageFeaturePageProps) {
  const feature = params.feature || 'quality';

  return (
    <AuthProviderWrapper>
      <div className="flex h-screen bg-gray-50">
        <ToolSidebar mediaType="image" activeFeature={feature} />
        <div className="flex-1 flex flex-col">
          <ToolHeader mediaType="image" />
          <UploadArea
            mediaType="image"
            feature={feature}
            onUploadSuccess={(file, uploadUrl, key) => {
              console.log('Upload successful:', { file, uploadUrl, key });
              // TODO: Navigate to processing page
            }}
            onUploadError={(error) => {
              console.error('Upload error:', error);
              alert(error);
            }}
          />
        </div>
      </div>
    </AuthProviderWrapper>
  );
}

