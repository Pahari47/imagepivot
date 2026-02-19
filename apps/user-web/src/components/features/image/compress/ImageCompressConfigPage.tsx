'use client';

import { FeatureConfigPageProps } from '../../../../lib/features/types';
import { ImagePreview } from '../../../../components/upload/ImagePreview';
import { ImageCompressConfig } from './ImageCompressConfig';
import { CompressConfig } from './ImageCompressConfig';

export function ImageCompressConfigPage({
  config,
  onChange,
  selectedFile,
  onRemoveFile,
  onProcess,
  error
}: FeatureConfigPageProps) {
  const compressConfig = config as CompressConfig;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 text-center">Compress your image</h2>
      <p className="text-gray-600 text-sm text-center">
        Reduce file size while maintaining acceptable quality
      </p>
      <div className="grid grid-cols-2 gap-6 mt-6">
        {/* Left Section: Image Preview */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Image ready to compress</h3>
          <ImagePreview
            file={selectedFile}
            onRemove={undefined}
            isUploading={false}
            uploadProgress={0}
          />
        </div>

        {/* Right Section: Compress Configuration */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={onRemoveFile}
              className="flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors text-gray-700 px-4 py-2 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Change Image
            </button>
            <button
              onClick={onProcess}
              className="flex items-center p-2 justify-center gap-1 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Compress Image
            </button>
          </div>

          <ImageCompressConfig
            config={config}
            onChange={onChange}
            selectedFile={selectedFile}
          />
        </div>
      </div>
    </div>
  );
}

