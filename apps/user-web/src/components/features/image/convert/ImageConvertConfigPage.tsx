'use client';

import { useState } from 'react';
import { FeatureConfigPageProps } from '../../../../lib/features/types';
import { ImageConvertConfig } from './ImageConvertConfig';
import { ConvertConfig } from './ImageConvertConfig';

export function ImageConvertConfigPage({
  config,
  onChange,
  selectedFile,
  onRemoveFile,
  onProcess,
  error
}: FeatureConfigPageProps) {
  const convertConfig = config as ConvertConfig;
  const [conversionType, setConversionType] = useState<'to' | 'from'>(convertConfig.conversionType || 'to');

  const handleConversionTypeChange = (type: 'to' | 'from') => {
    setConversionType(type);
    onChange({
      ...convertConfig,
      conversionType: type,
      format: type === 'to' ? 'png' : undefined,
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 text-center">
        {conversionType === 'to' ? 'Convert To PNG' : 'Convert From PNG'}
      </h2>
      <p className="text-gray-600 text-sm text-center mt-2">
        {conversionType === 'to'
          ? 'Convert your image to PNG format'
          : 'Convert your PNG image to various formats including jpg, svg and more.'}
      </p>

      <div className="mt-6">
        <div className="flex mb-6 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
          <button
            type="button"
            onClick={() => handleConversionTypeChange('to')}
            className={`
              flex-1 px-6 py-3 text-sm font-medium transition-all
              ${
                conversionType === 'to'
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-white text-gray-700'
              }
            `}
          >
            Convert To PNG
          </button>
          <button
            type="button"
            onClick={() => handleConversionTypeChange('from')}
            className={`
              flex-1 px-6 py-3 text-sm font-medium transition-all border-l border-gray-300
              ${
                conversionType === 'from'
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-white text-gray-700'
              }
            `}
          >
            Convert From PNG
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
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
            Convert Image
          </button>
        </div>

        <ImageConvertConfig
          config={config}
          onChange={onChange}
          selectedFile={selectedFile}
        />
      </div>
    </div>
  );
}

