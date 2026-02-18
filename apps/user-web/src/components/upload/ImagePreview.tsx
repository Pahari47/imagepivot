'use client';

import { useState, useEffect } from 'react';

interface ImagePreviewProps {
  file: File;
  onRemove?: () => void;
  onConfirm?: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export function ImagePreview({ file, onRemove, onConfirm, isUploading = false, uploadProgress = 0 }: ImagePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [file]);

  return (
    <div className="relative bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-2 max-h-[300px]">
      {previewUrl ? (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="bg-gray-200 rounded-lg p-4 w-full">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-auto max-h-[200px] object-contain rounded-lg"
            />
          </div>
          {/* <p className="text-sm text-gray-600">{file.name}</p>
          <p className="text-xs text-gray-500">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p> */}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-2 text-sm text-gray-600">Loading preview...</p>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}
    </div>
  );
}

