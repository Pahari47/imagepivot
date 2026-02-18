'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api/client';

interface UploadAreaProps {
  mediaType: 'image' | 'audio' | 'video';
  feature: string;
  onUploadSuccess?: (file: File, uploadUrl: string, key: string) => void;
  onUploadError?: (error: string) => void;
  showPreview?: boolean;
  onFileSelect?: (file: File) => void;
  selectedFile?: File | null;
}

export function UploadArea({ 
  mediaType, 
  feature, 
  onUploadSuccess, 
  onUploadError,
  showPreview = false,
  onFileSelect,
  selectedFile
}: UploadAreaProps) {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localSelectedFile, setLocalSelectedFile] = useState<File | null>(selectedFile || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (!user) {
        onUploadError?.('Please login to upload files');
        return;
      }

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const file = files[0];
        if (showPreview && onFileSelect) {
          setLocalSelectedFile(file);
          onFileSelect(file);
        } else {
          await handleFileUpload(file);
        }
      }
    },
    [user, onUploadError, showPreview, onFileSelect]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (showPreview && onFileSelect) {
          setLocalSelectedFile(file);
          onFileSelect(file);
        } else {
          await handleFileUpload(file);
        }
      }
    },
    [user, showPreview, onFileSelect]
  );

  const handleFileUpload = async (file: File) => {
    if (!user) {
      onUploadError?.('Please login to upload files');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get user's org
      const orgResponse = await apiClient.getMyOrg();
      if (!orgResponse.success || !orgResponse.data?.data?.org) {
        throw new Error('Failed to get organization');
      }

      const orgId = orgResponse.data.data.org.id;

      // Determine MIME type
      const mimeType = file.type || 'application/octet-stream';

      // Generate presigned URL
      const presignResponse = await apiClient.generatePresignedUrl({
        orgId,
        fileName: file.name,
        fileSize: file.size,
        mimeType,
        mediaType,
      });

      if (!presignResponse.success || !presignResponse.data?.data) {
        throw new Error(presignResponse.error || 'Failed to generate upload URL');
      }

      const { uploadUrl, key } = presignResponse.data.data;

      // Upload file to R2 using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': mimeType,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      setUploadProgress(100);
      onUploadSuccess?.(file, uploadUrl, key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getFeatureTitle = () => {
    const titles: Record<string, string> = {
      quality: 'Change quality of your image',
      resize: 'Resize your image',
      'convert-png': 'Convert to PNG',
      'convert-jpg': 'Convert to JPG',
    };
    return titles[feature] || 'Process your image';
  };

  const getFeatureDescription = () => {
    const descriptions: Record<string, string> = {
      quality: 'Upload image and select resolution to turn it in your desire quality',
      resize: 'Upload image and select dimensions to resize it',
      'convert-png': 'Upload image and convert it to PNG format',
      'convert-jpg': 'Upload image and convert it to JPG format',
    };
    return descriptions[feature] || 'Upload your file to get started';
  };

  const isDisabled = !user || isUploading;

  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-2 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-normal text-gray-900">{getFeatureTitle()}</h1>
          <p className="text-gray-600">{getFeatureDescription()}</p>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 bg-gray-100 border-dashed rounded-lg transition-colors ${
            isDragging
              ? 'border-red-500'
              : isDisabled
              ? 'border-gray-300 cursor-not-allowed'
              : 'border-gray-300 cursor-pointer'
          }`}
          onClick={() => !isDisabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={
              mediaType === 'image'
                ? 'image/*'
                : mediaType === 'audio'
                ? 'audio/*'
                : 'video/*'
            }
            onChange={handleFileSelect}
            disabled={isDisabled}
          />

          {/* Layered border effect: outer dashed, middle solid off-white, inner pink */}
          <div className={`border-2 rounded-lg m-3 ${
            isDragging
              ? 'border-red-500 bg-red-50'
              : isDisabled
              ? 'border-stone-100 bg-gray-50'
              : 'border-stone-100 bg-pink-50'
          }`}>
            <div className={`px-16 py-8 flex flex-col items-center rounded-lg justify-center min-h-[200px] ${
              isDragging
                ? 'bg-red-50'
                : isDisabled
                ? 'bg-gray-200'
                : 'bg-gray-200'
            }`}>
              {/* Center Image - constrained size */}
              <div className="flex -mt-6 justify-center items-center">
                <img 
                  src="/uploadimage.png" 
                  alt="Upload illustration"
                  className="w-56 h-56 object-contain"
                  style={{ width: '224px', height: '224px' }}
                  onError={(e) => {
                    // Fallback if image doesn't exist
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Text */}
              <p className="text-lg font-regular -mt-4 text-gray-900">
                Drop or Select {mediaType}
              </p>
              <p className="text-sm text-gray-600">
                Drop {mediaType} here or click{' '}
                <button
                  type="button"
                  className="text-red-600 hover:text-red-700 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Browse
                </button>{' '}
                through your machine
              </p>

              {!user && (
                <p className="text-sm text-red-600 mt-4">
                  Please login to upload and process files
                </p>
              )}

              {isUploading && (
                <div className="mt-4 w-full max-w-md">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Uploading... {uploadProgress}%</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

