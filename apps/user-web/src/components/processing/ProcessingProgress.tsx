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

  const getStatusText = () => {
    if (isCompleted) return 'Processing complete!';
    if (isFailed) return 'Processing failed';
    if (status === 'QUEUED') return 'Queued...';
    if (status === 'PROCESSING') return 'Processing your file...';
    return 'Processing...';
  };

  const getStatusColor = () => {
    if (isCompleted) return 'bg-green-600';
    if (isFailed) return 'bg-red-600';
    return 'bg-blue-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="text-center mb-6">
        <div className="inline-block mb-4">
          {isCompleted ? (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">✓</span>
            </div>
          ) : isFailed ? (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">✗</span>
            </div>
          ) : (
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{getStatusText()}</h3>
        {!isCompleted && !isFailed && (
          <p className="text-sm text-gray-600">Please wait while we process your file</p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="text-gray-900 font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`${getStatusColor()} h-3 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      {!isCompleted && !isFailed && (
        <div className="mt-6 flex items-center justify-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${progress >= 10 ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <div className={`w-2 h-2 rounded-full ${progress >= 50 ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <div className={`w-2 h-2 rounded-full ${progress >= 90 ? 'bg-blue-600' : 'bg-gray-300'}`} />
        </div>
      )}
    </div>
  );
}

