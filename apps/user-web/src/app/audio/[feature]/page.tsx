'use client';

import { UploadArea } from '../../../components/upload/UploadArea';

interface AudioFeaturePageProps {
  params: {
    feature: string;
  };
}

export default function AudioFeaturePage({ params }: AudioFeaturePageProps) {
  const feature = params.feature || 'quality';

  return (
    <div className="flex-1 overflow-y-auto p-8">
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
  );
}

