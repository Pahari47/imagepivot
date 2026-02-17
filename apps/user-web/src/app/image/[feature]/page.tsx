'use client';

import { useState, useEffect, use } from 'react';
import { UploadArea } from '../../../components/upload/UploadArea';
import { ImagePreview } from '../../../components/upload/ImagePreview';
import { ProcessingProgress } from '../../../components/processing/ProcessingProgress';
import { ImageResizeConfig, ResizeConfig } from '../../../components/features/ImageResizeConfig';
import { useJobStatus } from '../../../hooks/useJobStatus';
import { JobDownload } from '../../../components/jobs/JobDownload';
import { apiClient } from '../../../lib/api/client';
import { useAuth } from '../../../contexts/AuthContext';

interface ImageFeaturePageProps {
  params: Promise<{
    feature: string;
  }>;
}

type Step = 'upload' | 'config' | 'processing';

function ImageFeaturePageContent({ featureSlug }: { featureSlug: string }) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('upload');
  const [config, setConfig] = useState<ResizeConfig>({
    maintainAspect: true,
    quality: 95,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ file: File; key: string } | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [featureTitle, setFeatureTitle] = useState<string>('Image Resize');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { job, loading: jobLoading, isCompleted, isFailed, isProcessing } = useJobStatus({
    jobId,
    enabled: !!jobId,
  });

  useEffect(() => {
    if (featureSlug === 'resize') {
      apiClient.getFeatureBySlug('image.resize').then((response) => {
        if (response.success && response.data?.data) {
          setFeatureTitle(response.data.data.title);
        }
      });
    }
  }, [featureSlug]);

  const handleConfigNext = () => {
    if (featureSlug === 'resize') {
      if (!config.width && !config.height) {
        setError('At least one of width or height must be provided');
        return;
      }
    }
    setError(null);
    // After config is confirmed, start upload and processing
    if (selectedFile) {
      handleConfirmUpload();
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    // After file is selected, move to config step
    setStep('config');
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    if (!user) {
      setError('Please login to upload files');
      setIsUploading(false);
      return;
    }

    try {
      const orgResponse = await apiClient.getMyOrg();
      if (!orgResponse.success || !orgResponse.data?.data?.org) {
        throw new Error('Failed to get organization');
      }

      const orgId = orgResponse.data.data.org.id;
      const mimeType = selectedFile.type || 'application/octet-stream';

      const presignResponse = await apiClient.generatePresignedUrl({
        orgId,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType,
        mediaType: 'image',
      });

      if (!presignResponse.success || !presignResponse.data?.data) {
        throw new Error(presignResponse.error || 'Failed to generate upload URL');
      }

      const { uploadUrl, key } = presignResponse.data.data;

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': mimeType,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      setUploadProgress(100);
      setUploadedFile({ file: selectedFile, key });
      setStep('processing');

      const featureSlugApi = featureSlug === 'resize' ? 'image.resize' : featureSlug;

      const params: Record<string, unknown> = {};
      if (featureSlug === 'resize') {
        if (config.width) params.width = config.width;
        if (config.height) params.height = config.height;
        params.maintainAspect = config.maintainAspect;
        if (config.format) params.format = config.format;
        if (config.quality) params.quality = config.quality;
      }

      const jobResponse = await apiClient.createJob({
        orgId,
        featureSlug: featureSlugApi,
        mediaType: 'IMAGE',
        input: {
          key,
          sizeBytes: selectedFile.size,
          mimeType,
        },
        params,
      });

      if (jobResponse.success && jobResponse.data?.data) {
        setJobId(jobResponse.data.data.id);
      } else {
        throw new Error(jobResponse.error || 'Failed to create job');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadSuccess = async (file: File, _uploadUrl: string, key: string) => {
    setUploadedFile({ file, key });
    setStep('processing');
  };

  const handleUploadError = (error: string) => {
    setError(error);
  };

  const handleReset = () => {
    setStep('upload');
    setSelectedFile(null);
    setUploadedFile(null);
    setJobId(null);
    setError(null);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setStep('upload');
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{featureTitle}</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-6">
            <UploadArea
              mediaType="image"
              feature={featureSlug}
              showPreview={true}
              onFileSelect={handleFileSelect}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>
        )}

        {step === 'config' && featureSlug === 'resize' && selectedFile && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Image ready to convert</h3>
              <ImagePreview
                file={selectedFile}
                onRemove={handleRemoveFile}
                isUploading={false}
                uploadProgress={0}
              />
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-600 mb-6">
                Configure the resize settings for your image. At least one dimension (width or height) is required.
              </p>
              <ImageResizeConfig config={config} onChange={setConfig} />
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleConfigNext}
                  className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Process Image
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-6">
            {jobLoading && !job ? (
              <ProcessingProgress status="QUEUED" />
            ) : job ? (
              <>
                <ProcessingProgress 
                  status={job.status as 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'}
                  isCompleted={isCompleted}
                  isFailed={isFailed}
                />

                {isCompleted && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">File Ready!</h3>
                      <p className="text-sm text-gray-600">Your converted File is ready to download</p>
                    </div>
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={handleReset}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                      <JobDownload jobId={job.id} jobData={job} />
                    </div>
                  </div>
                )}

                {isFailed && (
                  <div className="bg-white rounded-lg border border-red-200 p-6">
                    <p className="text-sm text-red-600 mb-4">
                      {job.error || 'Processing failed. Please try again.'}
                    </p>
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ImageFeaturePage({ params }: ImageFeaturePageProps) {
  const resolvedParams = use(params);
  const featureSlug = resolvedParams.feature || 'resize';

  return <ImageFeaturePageContent featureSlug={featureSlug} />;
}
