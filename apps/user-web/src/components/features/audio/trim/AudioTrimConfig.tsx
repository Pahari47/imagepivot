'use client';

import { useState, useEffect } from 'react';
import { FeatureConfigProps } from '../../../../lib/features/types';

export interface TrimConfig {
  startTime?: number;
  endTime?: number;
  format?: string;
}

export function AudioTrimConfig({ config, onChange, selectedFile }: FeatureConfigProps) {
  const trimConfig = config as TrimConfig;
  
  const [startTime, setStartTime] = useState<number>(trimConfig.startTime || 0);
  const [endTime, setEndTime] = useState<number>(trimConfig.endTime || 10);
  const [format, setFormat] = useState<string>(trimConfig.format || '');

  // Sync with external config changes
  useEffect(() => {
    setStartTime(trimConfig.startTime || 0);
    setEndTime(trimConfig.endTime || 10);
    setFormat(trimConfig.format || '');
  }, [trimConfig.startTime, trimConfig.endTime, trimConfig.format]);

  const handleStartTimeChange = (value: number) => {
    setStartTime(value);
    onChange({
      ...trimConfig,
      startTime: value,
    });
  };

  const handleEndTimeChange = (value: number) => {
    setEndTime(value);
    onChange({
      ...trimConfig,
      endTime: value,
    });
  };

  const handleFormatChange = (value: string) => {
    setFormat(value);
    onChange({
      ...trimConfig,
      format: value || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
          Start Time (seconds): {startTime.toFixed(2)}
        </label>
        <input
          id="startTime"
          type="number"
          min="0"
          step="0.1"
          value={startTime}
          onChange={(e) => handleStartTimeChange(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <p className="text-xs text-gray-500 mt-2">
          The time in seconds where trimming should start
        </p>
      </div>

      <div>
        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
          End Time (seconds): {endTime.toFixed(2)}
        </label>
        <input
          id="endTime"
          type="number"
          min="0"
          step="0.1"
          value={endTime}
          onChange={(e) => handleEndTimeChange(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <p className="text-xs text-gray-500 mt-2">
          The time in seconds where trimming should end (must be greater than start time)
        </p>
        {endTime <= startTime && (
          <p className="text-xs text-red-600 mt-1">
            End time must be greater than start time
          </p>
        )}
      </div>

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
          <option value="">Keep original</option>
          <option value="mp3">MP3</option>
          <option value="wav">WAV</option>
          <option value="aac">AAC</option>
          <option value="m4a">M4A</option>
          <option value="ogg">OGG</option>
          <option value="flac">FLAC</option>
          <option value="webm">WebM</option>
          <option value="opus">Opus</option>
        </select>
        <p className="text-xs text-gray-500 mt-2">
          Convert to a different format during trimming
        </p>
      </div>
    </div>
  );
}

