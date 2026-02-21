'use client';

import { FeatureConfigPageProps } from '../../../../lib/features/types';
import { AudioConvertConfig } from './AudioConvertConfig';
import { ConvertConfig } from './AudioConvertConfig';

export function AudioConvertConfigPage({
  config,
  onChange,
  selectedFile,
  onRemoveFile,
  onProcess,
  error
}: FeatureConfigPageProps) {
  const convertConfig = config as ConvertConfig;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 text-center">Convert your audio</h2>
      <p className="text-gray-600 text-sm text-center">
        Convert your audio file to a different format
      </p>
      <div className="grid grid-cols-2 gap-6 mt-6">
        {/* Left Section: File Info */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Audio file ready</h3>
          {selectedFile && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Convert Configuration */}
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
              Change Audio
            </button>
            <button
              onClick={onProcess}
              className="flex items-center p-2 justify-center gap-1 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Convert Audio
            </button>
          </div>

          <AudioConvertConfig
            config={config}
            onChange={onChange}
            selectedFile={selectedFile}
          />
        </div>
      </div>
    </div>
  );
}




