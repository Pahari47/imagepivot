'use client';

import { useState, useEffect } from 'react';
import { FeatureConfigProps } from '../../../../lib/features/types';

export interface QualityConfig {
  quality?: number;
  format?: string;
  optimize?: boolean;
}

export function ImageQualityConfig({ config, onChange }: FeatureConfigProps) {
  const qualityConfig = config as QualityConfig;
  
  const [quality, setQuality] = useState<number>(qualityConfig.quality || 95);
  const [format, setFormat] = useState<string>(qualityConfig.format || '');
  const [optimize, setOptimize] = useState<boolean>(qualityConfig.optimize ?? true);

  // Sync with external config changes
  useEffect(() => {
    setQuality(qualityConfig.quality || 95);
    setFormat(qualityConfig.format || '');
    setOptimize(qualityConfig.optimize ?? true);
  }, [qualityConfig.quality, qualityConfig.format, qualityConfig.optimize]);

  const handleQualityChange = (value: number) => {
    setQuality(value);
    onChange({
      ...qualityConfig,
      quality: value,
    });
  };

  const handleFormatChange = (value: string) => {
    setFormat(value);
    onChange({
      ...qualityConfig,
      format: value || undefined,
    });
  };

  const handleOptimizeChange = (checked: boolean) => {
    setOptimize(checked);
    onChange({
      ...qualityConfig,
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
          <span>Low (1)</span>
          <span>High (100)</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Adjust the quality level of your image. Higher values preserve more detail but result in larger file sizes.
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
          Optionally convert to a different format while adjusting quality
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

