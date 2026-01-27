'use client';

import { AuthProviderWrapper } from '../../../components/providers/AuthProviderWrapper';
import { ToolSidebar } from '../../../components/layout/ToolSidebar';
import { ToolHeader } from '../../../components/layout/ToolHeader';
import { UploadArea } from '../../../components/upload/UploadArea';

interface AudioFeaturePageProps {
  params: {
    feature: string;
  };
}

export default function AudioFeaturePage({ params }: AudioFeaturePageProps) {
  const feature = params.feature || 'quality';

  return (
    <AuthProviderWrapper>
      <div className="flex h-screen bg-gray-50">
        <ToolSidebar mediaType="audio" activeFeature={feature} />
        <div className="flex-1 flex flex-col">
          <ToolHeader mediaType="audio" />
          <UploadArea
            mediaType="audio"
            feature={feature}
            onUploadSuccess={(file, uploadUrl, key) => {
              console.log('Upload successful:', { file, uploadUrl, key });
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

