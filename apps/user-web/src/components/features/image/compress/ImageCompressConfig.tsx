'use client';

import { useState, useEffect } from 'react';
import { FeatureConfigProps } from '../../../../lib/features/types';

export interface CompressConfig {
  quality?: number;
  format?: string;
  optimize?: boolean;
}

export function ImageCompressConfig({ config, onChange }: FeatureConfigProps) {
  const compressConfig = config as CompressConfig;
  
  const [quality, setQuality] = useState<number>(compressConfig.quality || 85);
  const [format, setFormat] = useState<string>(compressConfig.format || '');
  const [optimize, setOptimize] = useState<boolean>(compressConfig.optimize ?? true);

  // Sync with external config changes
  useEffect(() => {
    setQuality(compressConfig.quality || 85);
    setFormat(compressConfig.format || '');
    setOptimize(compressConfig.optimize ?? true);
  }, [compressConfig.quality, compressConfig.format, compressConfig.optimize]);

  const handleQualityChange = (value: number) => {
    setQuality(value);
    onChange({
      ...compressConfig,
      quality: value,
    });
  };

  const handleFormatChange = (value: string) => {
    setFormat(value);
    onChange({
      ...compressConfig,
      format: value || undefined,
    });
  };

  const handleOptimizeChange = (checked: boolean) => {
    setOptimize(checked);
    onChange({
      ...compressConfig,
      optimize: checked,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="quality" className="block text-sm font-medium text-gray-700 mb-1">
          Quality: {quality}
        </label>
        <input
          id="quality"
          type="range"
          min="1"
          max="100"
          value={quality}
          onChange={(e) => handleQualityChange(parseInt(e.target.value, 10))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Low (smaller file)</span>
          <span>High (better quality)</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Lower quality = smaller file size, but may reduce image quality
        </p>
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
          <option value="jpeg">JPEG</option>
          <option value="png">PNG</option>
          <option value="webp">WebP</option>
          <option value="gif">GIF</option>
          <option value="bmp">BMP</option>
        </select>
        <p className="text-xs text-gray-500 mt-2">
          Convert to a different format for better compression
        </p>
      </div>

      <div className="flex items-center">
        <input
          id="optimize"
          type="checkbox"
          checked={optimize}
          onChange={(e) => handleOptimizeChange(e.target.checked)}
          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
        />
        <label htmlFor="optimize" className="ml-2 text-sm text-gray-700">
          Enable optimization
        </label>
      </div>
    </div>
  );
}

