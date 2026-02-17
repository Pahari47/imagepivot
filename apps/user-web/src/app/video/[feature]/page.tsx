'use client';

import { UploadArea } from '../../../components/upload/UploadArea';

interface VideoFeaturePageProps {
  params: {
    feature: string;
  };
}

export default function VideoFeaturePage({ params }: VideoFeaturePageProps) {
  const feature = params.feature || 'quality';

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <UploadArea
        mediaType="video"
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
  );
}

