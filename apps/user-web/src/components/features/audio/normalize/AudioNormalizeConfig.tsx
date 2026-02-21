'use client';

import { useState, useEffect } from 'react';
import { FeatureConfigProps } from '../../../../lib/features/types';

export interface NormalizeConfig {
  targetLevel?: number;
  format?: string;
}

const TARGET_LEVELS = [
  { value: -16, label: '-16 LUFS', description: 'Industry Standard (Default)' },
  { value: -14, label: '-14 LUFS', description: 'Music Streaming' },
  { value: -18, label: '-18 LUFS', description: 'Speech/Podcast' },
  { value: -20, label: '-20 LUFS', description: 'Broadcast TV' },
  { value: -23, label: '-23 LUFS', description: 'EBU R128 Standard' },
];

const OUTPUT_FORMATS = [
  { value: '', label: 'Keep Original Format' },
  { value: 'mp3', label: 'MP3' },
  { value: 'wav', label: 'WAV' },
  { value: 'flac', label: 'FLAC' },
  { value: 'aac', label: 'AAC' },
  { value: 'ogg', label: 'OGG' },
  { value: 'm4a', label: 'M4A' },
];

export function AudioNormalizeConfig({ config, onChange }: FeatureConfigProps) {
  const normalizeConfig = config as NormalizeConfig;

  const [targetLevel, setTargetLevel] = useState<number>(normalizeConfig.targetLevel || -16);
  const [format, setFormat] = useState<string>(normalizeConfig.format || '');
  const [customLevel, setCustomLevel] = useState<boolean>(false);

  useEffect(() => {
    setTargetLevel(normalizeConfig.targetLevel || -16);
    setFormat(normalizeConfig.format || '');
    // Check if targetLevel is not in the preset list
    const isCustom = !TARGET_LEVELS.some(preset => preset.value === (normalizeConfig.targetLevel || -16));
    setCustomLevel(isCustom);
  }, [normalizeConfig.targetLevel, normalizeConfig.format]);

  const handleTargetLevelChange = (value: number) => {
    setTargetLevel(value);
    setCustomLevel(false);
    onChange({
      ...normalizeConfig,
      targetLevel: value,
    });
  };

  const handleCustomLevelChange = (value: number) => {
    setTargetLevel(value);
    setCustomLevel(true);
    onChange({
      ...normalizeConfig,
      targetLevel: value,
    });
  };

  const handleFormatChange = (value: string) => {
    setFormat(value);
    onChange({
      ...normalizeConfig,
      format: value || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Target Level Selection */}
      <div>
        <label htmlFor="targetLevel" className="block text-sm font-medium text-gray-700 mb-2">
          Target Loudness Level
        </label>
        <div className="space-y-3">
          {TARGET_LEVELS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleTargetLevelChange(preset.value)}
              className={`
                w-full px-4 py-3 rounded-lg text-left border transition-colors
                ${targetLevel === preset.value && !customLevel
                  ? 'bg-red-50 border-red-500 text-red-900'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{preset.label}</div>
                  <div className="text-xs text-gray-500">{preset.description}</div>
                </div>
                {targetLevel === preset.value && !customLevel && (
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Level Slider */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="customLevel" className="block text-sm font-medium text-gray-700">
            Custom Level: {targetLevel.toFixed(1)} LUFS
          </label>
          <button
            type="button"
            onClick={() => handleCustomLevelChange(-16)}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Reset to Default
          </button>
        </div>
        <input
          id="customLevel"
          type="range"
          min="-23"
          max="-12"
          step="0.1"
          value={targetLevel}
          onChange={(e) => handleCustomLevelChange(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>-23 LUFS (Quieter)</span>
          <span>-16 LUFS (Standard)</span>
          <span>-12 LUFS (Louder)</span>
        </div>
      </div>

      {/* Output Format (Optional) */}
      <div>
        <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
          Output Format (Optional)
        </label>
        <select
          id="format"
          value={format}
          onChange={(e) => handleFormatChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {OUTPUT_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Leave as "Keep Original Format" to preserve the input format
        </p>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Normalization:</span> Adjusts the audio volume to a consistent loudness level using the LUFS (Loudness Units relative to Full Scale) standard. This ensures your audio sounds consistent across different playback devices.
        </p>
      </div>
    </div>
  );
}


