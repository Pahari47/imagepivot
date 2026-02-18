'use client';

import { useState } from 'react';
import { apiClient } from '../../lib/api/client';

interface JobDownloadProps {
  jobId: string;
  onDownloadStart?: () => void;
  onDownloadError?: (error: string) => void;
}

export function JobDownload({ jobId, onDownloadStart, onDownloadError }: JobDownloadProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    onDownloadStart?.();

    try {
      const response = await apiClient.getJobDownloadUrl(jobId);
      if (response.success && response.data?.data?.downloadUrl) {
        const downloadUrl = response.data.data.downloadUrl;
        
        // Fetch the file as a blob
        const fileResponse = await fetch(downloadUrl);
        if (!fileResponse.ok) {
          throw new Error('Failed to download file');
        }
        
        const blob = await fileResponse.blob();
        
        // Create a blob URL and trigger download
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        
        // Extract filename from Content-Disposition header or use default
        const contentDisposition = fileResponse.headers.get('Content-Disposition');
        let filename = 'download';
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
            // Decode URI if needed
            try {
              filename = decodeURIComponent(filename);
            } catch {
              // If decoding fails, use as-is
            }
          }
        } else {
          // Fallback: try to extract from URL or use default based on content type
          const contentType = fileResponse.headers.get('Content-Type');
          if (contentType) {
            const extension = contentType.split('/')[1]?.split(';')[0] || 'bin';
            filename = `output.${extension}`;
          }
        }
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl);
      } else {
        onDownloadError?.(response.error || 'Failed to get download URL');
      }
    } catch (error) {
      onDownloadError?.(error instanceof Error ? error.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {downloading ? 'Preparing download...' : 'Download'}
    </button>
  );
}

