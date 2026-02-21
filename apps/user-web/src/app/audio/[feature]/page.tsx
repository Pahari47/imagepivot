'use client';

import { useState, useEffect, use } from 'react';
import { UploadArea } from '../../../components/upload/UploadArea';
import { ProcessingProgress } from '../../../components/processing/ProcessingProgress';
import { AudioFeatureConfigPageLoader } from '../../../components/features/audio/FeatureConfigPageLoader';
import { useJobStatus } from '../../../hooks/useJobStatus';
import { JobDownload } from '../../../components/jobs/JobDownload';
import { apiClient } from '../../../lib/api/client';
import { useAuth } from '../../../contexts/AuthContext';
import { getFeatureHandler } from '../../../lib/features/feature-registry';
import '../../../components/features/audio'; // Auto-register audio features

interface AudioFeaturePageProps {
  params: Promise<{
    feature: string;
  }>;
}

type Step = 'upload' | 'config' | 'processing';

function AudioFeaturePageContent({ featureSlug }: { featureSlug: string }) {
  console.log('[AudioFeaturePage] Rendering with featureSlug:', featureSlug);
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('upload');
  console.log('[AudioFeaturePage] Initial step:', step);
  
  // Get feature handler from registry
  const featureHandler = getFeatureHandler(featureSlug);
  console.log('[AudioFeaturePage] Feature handler:', featureHandler ? 'found' : 'not found');
  const [config, setConfig] = useState<Record<string, unknown>>(
    featureHandler?.defaultConfig || {}
  );
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ file: File; key: string } | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [featureTitle, setFeatureTitle] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { job, loading: jobLoading, isCompleted, isFailed, isProcessing } = useJobStatus({
    jobId,
    enabled: !!jobId,
  });

  useEffect(() => {
    // Fetch feature title for any feature slug
    if (featureSlug) {
      const apiSlug = featureHandler?.getApiSlug(featureSlug) || `audio.${featureSlug}`;
      apiClient.getFeatureBySlug(apiSlug).then((response) => {
        if (response.success && response.data?.data) {
          setFeatureTitle(response.data.data.title);
        }
      }).catch(() => {
        // Fallback to capitalized feature slug if API call fails
        setFeatureTitle(featureSlug.charAt(0).toUpperCase() + featureSlug.slice(1));
      });
    }
  }, [featureSlug, featureHandler]);

  // Reset config when feature changes
  useEffect(() => {
    if (featureHandler) {
      setConfig(featureHandler.defaultConfig);
    }
  }, [featureSlug, featureHandler]);

  // Reset step if we're in processing but have no file or job
  useEffect(() => {
    if (step === 'processing' && !selectedFile && !uploadedFile && !jobId) {
      console.log('[AudioFeaturePage] Resetting step from processing to upload (no file/job)');
      setStep('upload');
    }
  }, [step, selectedFile, uploadedFile, jobId]);

  const handleConfigNext = () => {
    // Use feature handler for validation
    if (featureHandler) {
      const validationError = featureHandler.validate(config);
      if (validationError) {
        setError(validationError);
        return;
      }
    } else {
      setError(`Feature "${featureSlug}" is not supported`);
      return;
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
        mediaType: 'audio',
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

      // Use feature handler to get API slug and build params
      if (!featureHandler) {
        throw new Error(`Feature handler not found for: ${featureSlug}`);
      }

      const featureSlugApi = featureHandler.getApiSlug(featureSlug);
      const params = featureHandler.buildParams(config);

      const jobResponse = await apiClient.createJob({
        orgId,
        featureSlug: featureSlugApi,
        mediaType: 'AUDIO',
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
    console.log('[AudioFeaturePage] handleUploadSuccess called with file:', file.name);
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
    // Reset config to default
    if (featureHandler) {
      setConfig(featureHandler.defaultConfig);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setStep('upload');
  };

  console.log('[AudioFeaturePage] Current step:', step, 'selectedFile:', selectedFile);
  
  return (
    <div className={`flex-1 overflow-y-auto ${step === 'config' ? 'p-6' : 'p-8'}`}>
      {step === 'config' ? (
        // Full width container for config step
        <div className="w-full">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {selectedFile ? (
          <AudioFeatureConfigPageLoader
            featureSlug={featureSlug}
            config={config}
            onChange={setConfig}
            selectedFile={selectedFile}
            onRemoveFile={handleRemoveFile}
            onProcess={handleConfigNext}
            error={error}
          />
          ) : (
            <div className="p-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <p className="text-sm text-yellow-800">No file selected. Please go back and select a file.</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Constrained width container for upload and processing steps
        <>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-4xl mx-auto">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {step === 'upload' && (() => {
            console.log('[AudioFeaturePage] Rendering UploadArea');
            return (
              <UploadArea
                mediaType="audio"
                feature={featureSlug}
                showPreview={false}
                onFileSelect={handleFileSelect}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
              />
            );
          })()}

          {step === 'processing' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {!uploadedFile && !job ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <p className="text-sm text-yellow-800">
                    No file uploaded. Please go back and upload a file first.
                  </p>
                  <button
                    onClick={() => setStep('upload')}
                    className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    Go Back to Upload
                  </button>
                </div>
              ) : jobLoading && !job ? (
                <ProcessingProgress status="QUEUED" />
              ) : job ? (
                <>
                  <ProcessingProgress 
                    status={job.status as 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'}
                    isCompleted={isCompleted}
                    isFailed={isFailed}
                  />

                  {isCompleted && (
                    <div className="bg-white rounded-lg border border-blue-200 p-6">
                      <div className="text-center">
                        {/* Success Icon */}
                        <div className="flex justify-center mb-4">
                          <div className="w-16 h-16 rounded-full border-2 border-green-400 flex items-center justify-center">
                            <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        
                        {/* Heading */}
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">File Ready!</h3>
                        
                        {/* Subtitle */}
                        <p className="text-sm text-gray-600 mb-4">Your processed file is ready to download</p>
                        
                        {/* Step Indicators */}
                        <div className="flex items-center justify-center gap-1 mb-6">
                          <div className="h-1 w-8 rounded bg-gray-300" />
                          <div className="h-1 w-8 rounded bg-gray-300" />
                          <div className="h-1 w-8 rounded bg-gray-600" />
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={handleReset}
                            className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                          >
                            close
                          </button>
                          <JobDownload jobId={job.id} />
                        </div>
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
        </>
      )}
    </div>
  );
}

export default function AudioFeaturePage({ params }: AudioFeaturePageProps) {
  console.log('[AudioFeaturePage] Component mounted');
  const resolvedParams = use(params);
  const featureSlug = resolvedParams.feature || 'trim';
  console.log('[AudioFeaturePage] Resolved featureSlug:', featureSlug);

  return <AudioFeaturePageContent featureSlug={featureSlug} />;
}
