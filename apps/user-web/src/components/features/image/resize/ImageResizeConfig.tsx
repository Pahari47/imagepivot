'use client';

import { useState, useEffect } from 'react';
import { FeatureConfigProps } from '../../../../lib/features/types';

export interface ResizeConfig {
  width?: number;
  height?: number;
  maintainAspect?: boolean;
  format?: string;
  quality?: number;
}

export function ImageResizeConfig({ config, onChange }: FeatureConfigProps) {
  const resizeConfig = config as ResizeConfig;
  
  const [width, setWidth] = useState<string>(resizeConfig.width?.toString() || '');
  const [height, setHeight] = useState<string>(resizeConfig.height?.toString() || '');
  const [maintainAspect, setMaintainAspect] = useState(resizeConfig.maintainAspect ?? true);
  const [format, setFormat] = useState<string>(resizeConfig.format || '');
  const [quality, setQuality] = useState<number>(resizeConfig.quality || 95);

  // Sync with external config changes
  useEffect(() => {
    setWidth(resizeConfig.width?.toString() || '');
    setHeight(resizeConfig.height?.toString() || '');
    setMaintainAspect(resizeConfig.maintainAspect ?? true);
    setFormat(resizeConfig.format || '');
    setQuality(resizeConfig.quality || 95);
  }, [resizeConfig.width, resizeConfig.height, resizeConfig.maintainAspect, resizeConfig.format, resizeConfig.quality]);

  const handleWidthChange = (value: string) => {
    setWidth(value);
    const numValue = value ? parseInt(value, 10) : undefined;
    onChange({
      ...resizeConfig,
      width: numValue,
    });
  };

  const handleHeightChange = (value: string) => {
    setHeight(value);
    const numValue = value ? parseInt(value, 10) : undefined;
    onChange({
      ...resizeConfig,
      height: numValue,
    });
  };

  const handleMaintainAspectChange = (checked: boolean) => {
    setMaintainAspect(checked);
    onChange({
      ...resizeConfig,
      maintainAspect: checked,
    });
  };

  const handleFormatChange = (value: string) => {
    setFormat(value);
    onChange({
      ...resizeConfig,
      format: value || undefined,
    });
  };

  const handleQualityChange = (value: number) => {
    setQuality(value);
    onChange({
      ...resizeConfig,
      quality: value,
    });
  };

  const hasError = !width && !height;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
            Height :
          </label>
          <input
            id="height"
            type="number"
            min="1"
            max="10000"
            value={height}
            onChange={(e) => handleHeightChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="1080"
          />
        </div>

        <div>
          <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-2">
            Width :
          </label>
          <input
            id="width"
            type="number"
            min="1"
            max="10000"
            value={width}
            onChange={(e) => handleWidthChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="1920"
          />
        </div>
      </div>

      {hasError && (
        <p className="text-sm text-red-600">At least one of width or height must be provided</p>
      )}

      <div className="flex items-center">
        <input
          id="maintainAspect"
          type="checkbox"
          checked={maintainAspect}
          onChange={(e) => handleMaintainAspectChange(e.target.checked)}
          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
        />
        <label htmlFor="maintainAspect" className="ml-2 text-sm text-gray-700">
          Maintain aspect ratio
        </label>
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
      </div>

      {(format === 'jpeg' || format === 'jpg' || format === 'webp' || !format) && (
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
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
      )}
    </div>
  );
}

