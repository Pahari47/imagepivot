'use client';

import { useState, useEffect } from 'react';

interface ProcessingProgressProps {
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  isCompleted?: boolean;
  isFailed?: boolean;
}

export function ProcessingProgress({ status, isCompleted = false, isFailed = false }: ProcessingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isCompleted) {
      setProgress(100);
      return;
    }

    if (isFailed) {
      setProgress(0);
      return;
    }

    if (status === 'QUEUED') {
      setProgress(10);
    } else if (status === 'PROCESSING') {
      // Simulate approximate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 5;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [status, isCompleted, isFailed]);

  // If completed, don't show the processing animation
  if (isCompleted) {
    return null; // Completion UI is handled in page.tsx
  }

  if (isFailed) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-red-600">✗</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing failed</h3>
          <p className="text-sm text-gray-600">Please try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">

      <div className="text-center mb-6 relative">
        {/* Header Text */}
        <p className="text-sm text-gray-500 mb-4">Uploading</p>

        {/* Clouds and File Icons Container */}
        <div className="relative h-32 mb-6 flex items-center justify-center overflow-hidden">
          {/* Two Clouds - Bobbing Animation */}
          <div className="relative z-10 flex items-center gap-4">
            <svg className="w-16 h-16 cloud-float-1" fill="white" stroke="gray" strokeWidth="1" viewBox="0 0 100 100">
              <path d="M50 30 Q30 20 20 30 Q20 20 30 20 Q30 10 40 15 Q45 5 50 10 Q55 5 60 15 Q70 10 80 20 Q80 20 80 30 Q70 20 50 30 Z" />
            </svg>
            <svg className="w-16 h-16 cloud-float-2" fill="white" stroke="gray" strokeWidth="1" viewBox="0 0 100 100">
              <path d="M50 30 Q30 20 20 30 Q20 20 30 20 Q30 10 40 15 Q45 5 50 10 Q55 5 60 15 Q70 10 80 20 Q80 20 80 30 Q70 20 50 30 Z" />
            </svg>
          </div>

          {/* Three File Icons - Moving Up Animation */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full">
            {/* Image Icon - Green */}
            <div className="file-icon-1 absolute left-[45%] bottom-0">
              <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {/* Document Icon - Blue */}
            <div className="file-icon-2 absolute left-[48%] bottom-0">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {/* Video Icon - Red */}
            <div className="file-icon-3 absolute left-[51%] bottom-0">
              <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Status Text */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Uploading Files...</h3>

        {/* Progress Bar */}
        <div className="space-y-2 mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-center text-sm">
            <span className="text-blue-600 underline">{Math.round(progress)}</span>
            <span className="text-gray-600"> / 100%</span>
          </div>
        </div>

        {/* Secondary Status Text */}
        <p className="text-sm text-gray-500 mb-4">Preparing your files for convert</p>

        {/* Secondary Progress Bar (Step Indicators) */}
        <div className="flex items-center justify-center gap-1">
          <div className={`h-1 w-8 rounded ${progress >= 33 ? 'bg-gray-600' : 'bg-gray-300'}`} />
          <div className={`h-1 w-8 rounded ${progress >= 66 ? 'bg-gray-600' : 'bg-gray-300'}`} />
          <div className={`h-1 w-8 rounded ${progress >= 100 ? 'bg-gray-600' : 'bg-gray-300'}`} />
        </div>
      </div>
    </div>
  );
}

