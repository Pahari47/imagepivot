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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Image ready to convert</h3>
      
      <div className="relative bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8">
        {previewUrl ? (
          <div className="flex flex-col items-center">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-96 object-contain rounded-lg mb-4"
            />
            <p className="text-sm text-gray-600">{file.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-2 text-sm text-gray-600">Loading preview...</p>
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

      {!isUploading && (
        <div className="flex justify-end space-x-3 mt-4">
          {onRemove && (
            <button
              onClick={onRemove}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors"
            >
              Change Image
            </button>
          )}
          {onConfirm && (
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Confirm & Upload
            </button>
          )}
        </div>
      )}
    </div>
  );
}

