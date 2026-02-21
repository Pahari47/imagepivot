'use client';

import { useState, useEffect } from 'react';
import { FeatureConfigProps } from '../../../../lib/features/types';

export interface ConvertConfig {
  format?: string;
  quality?: 'low' | 'medium' | 'high' | 'custom';
  bitrate?: number;
}

const AUDIO_FORMATS = [
  { value: 'mp3', label: 'MP3', lossy: true },
  { value: 'wav', label: 'WAV', lossy: false },
  { value: 'flac', label: 'FLAC', lossy: false },
  { value: 'aac', label: 'AAC', lossy: true },
  { value: 'ogg', label: 'OGG', lossy: true },
  { value: 'wma', label: 'WMA', lossy: true },
  { value: 'alac', label: 'ALAC', lossy: false },
  { value: 'm4a', label: 'M4A', lossy: true },
];

const QUALITY_PRESETS = [
  { value: 'low', label: 'Low', description: '96 kbps - Smaller size', bitrate: 96 },
  { value: 'medium', label: 'Medium', description: '192 kbps - Balanced (Default)', bitrate: 192 },
  { value: 'high', label: 'High', description: '320 kbps - Better quality', bitrate: 320 },
  { value: 'custom', label: 'Custom', description: 'Set your own bitrate', bitrate: null },
];

export function AudioConvertConfig({ config, onChange }: FeatureConfigProps) {
  const convertConfig = config as ConvertConfig;
  
  const [format, setFormat] = useState<string>(convertConfig.format || '');
  const [quality, setQuality] = useState<'low' | 'medium' | 'high' | 'custom'>(
    convertConfig.quality || 'medium'
  );
  const [bitrate, setBitrate] = useState<number>(convertConfig.bitrate || 192);

  // Sync with external config changes
  useEffect(() => {
    setFormat(convertConfig.format || '');
    setQuality(convertConfig.quality || 'medium');
    setBitrate(convertConfig.bitrate || 192);
  }, [convertConfig.format, convertConfig.quality, convertConfig.bitrate]);

  const selectedFormat = AUDIO_FORMATS.find(f => f.value === format);
  const isLossy = selectedFormat?.lossy || false;

  const handleFormatChange = (value: string) => {
    setFormat(value);
    onChange({
      ...convertConfig,
      format: value,
      // Reset quality to medium when format changes
      quality: 'medium',
      bitrate: undefined,
    });
  };

  const handleQualityChange = (value: 'low' | 'medium' | 'high' | 'custom') => {
    setQuality(value);
    const preset = QUALITY_PRESETS.find(p => p.value === value);
    const newBitrate = value === 'custom' ? bitrate : preset?.bitrate;
    
    onChange({
      ...convertConfig,
      quality: value,
      bitrate: value === 'custom' ? bitrate : undefined,
    });
  };

  const handleBitrateChange = (value: number) => {
    setBitrate(value);
    onChange({
      ...convertConfig,
      bitrate: value,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Output Format
        </label>
        <div className="grid grid-cols-4 gap-3">
          {AUDIO_FORMATS.map((audioFormat) => {
            const isSelected = format === audioFormat.value;
            return (
              <button
                key={audioFormat.value}
                type="button"
                onClick={() => handleFormatChange(audioFormat.value)}
                className={`
                  flex flex-col items-center justify-center p-4 rounded-lg transition-all
                  ${isSelected 
                    ? 'ring-2 ring-red-500 ring-offset-2 bg-red-50 border-2 border-red-300' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }
                `}
              >
                <div className="text-lg font-semibold text-gray-700 mb-1">
                  {audioFormat.label}
                </div>
                {audioFormat.lossy && (
                  <span className="text-xs text-gray-500">Lossy</span>
                )}
                {!audioFormat.lossy && (
                  <span className="text-xs text-green-600 font-medium">Lossless</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {format && isLossy && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Quality / Bitrate
          </label>
          <div className="space-y-2">
            {QUALITY_PRESETS.map((preset) => {
              const isSelected = quality === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleQualityChange(preset.value as 'low' | 'medium' | 'high' | 'custom')}
                  className={`
                    w-full text-left p-3 rounded-lg border transition-all
                    ${isSelected
                      ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{preset.label}</div>
                      <div className="text-xs text-gray-600">{preset.description}</div>
                    </div>
                    {isSelected && (
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {quality === 'custom' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <label htmlFor="bitrate" className="block text-sm font-medium text-gray-700 mb-2">
                Custom Bitrate (kbps): {bitrate}
              </label>
              <input
                id="bitrate"
                type="range"
                min="64"
                max="320"
                step="32"
                value={bitrate}
                onChange={(e) => handleBitrateChange(parseInt(e.target.value, 10))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>64 kbps</span>
                <span>320 kbps</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Current: {bitrate} kbps
              </p>
            </div>
          )}
        </div>
      )}

      {format && !isLossy && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">{selectedFormat?.label}</span> is a lossless format. 
            No quality settings needed - the audio will be converted without quality loss.
          </p>
        </div>
      )}

      {format && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            Selected format: <span className="font-semibold uppercase">{format}</span>
            {isLossy && quality !== 'custom' && (
              <span> at {QUALITY_PRESETS.find(p => p.value === quality)?.bitrate}k bitrate</span>
            )}
            {isLossy && quality === 'custom' && (
              <span> at {bitrate}k bitrate (custom)</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}





