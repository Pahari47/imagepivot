'use client';

import { FeatureConfigProps } from '../../../../lib/features/types';

export interface ConvertJpgConfig {
  format?: string;
  conversionType?: 'to' | 'from';
}

const FORMATS = [
  { value: 'jpeg', label: 'JPEG', icon: '📷' },
  { value: 'jpg', label: 'JPG', icon: '📷' },
  { value: 'png', label: 'PNG', icon: '🖼️' },
  { value: 'svg', label: 'SVG', icon: '🎨' },
  { value: 'webp', label: 'WebP', icon: '🌐' },
  { value: 'gif', label: 'GIF', icon: '🎬' },
  { value: 'bmp', label: 'BMP', icon: '🖼️' },
  { value: 'tif', label: 'TIF', icon: '📄' },
  { value: 'tiff', label: 'TIFF', icon: '📄' },
  { value: 'ico', label: 'ICO', icon: '🔲' },
  { value: 'heic', label: 'HEIC', icon: '📱' },
  { value: 'avif', label: 'AVIF', icon: '📸' },
];

export function ImageConvertJpgConfig({ config, onChange }: FeatureConfigProps) {
  const convertConfig = config as ConvertJpgConfig;
  const selectedFormat = convertConfig.format || '';
  const conversionType = convertConfig.conversionType || 'to';

  const handleFormatSelect = (format: string) => {
    onChange({
      ...convertConfig,
      format,
    });
  };

  // For "Convert To JPG", format is always JPG
  // For "Convert From JPG", show format selection (excluding JPG/JPEG)
  const availableFormats = conversionType === 'to' 
    ? FORMATS.filter(f => f.value === 'jpg' || f.value === 'jpeg')
    : FORMATS.filter(f => f.value !== 'jpg' && f.value !== 'jpeg');

  // Color mapping for different formats
  const getFormatColor = (formatValue: string) => {
    if (formatValue === 'jpeg' || formatValue === 'jpg') {
      return { iconBg: 'bg-orange-100', textColor: 'text-orange-600' };
    } else if (formatValue === 'svg') {
      return { iconBg: 'bg-orange-100', textColor: 'text-orange-600' };
    } else if (formatValue === 'tif' || formatValue === 'tiff') {
      return { iconBg: 'bg-purple-100', textColor: 'text-purple-600' };
    } else {
      return { iconBg: 'bg-orange-100', textColor: 'text-orange-600' };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="grid grid-cols-4 gap-4">
          {availableFormats.map((format) => {
            const colors = getFormatColor(format.value);
            const isSelected = selectedFormat === format.value;
            return (
              <button
                key={format.value}
                type="button"
                onClick={() => handleFormatSelect(format.value)}
                className={`
                  flex flex-col items-center justify-center p-6 rounded-lg transition-all shadow-sm
                  ${isSelected ? 'ring-2 ring-red-500 ring-offset-2' : ''}
                  bg-amber-50 hover:bg-amber-100 border border-amber-200
                `}
              >
                <div className={`text-2xl mb-2 ${colors.iconBg} rounded p-2`}>
                  {format.icon}
                </div>
                <div className={`text-xs font-semibold ${colors.textColor} mb-1`}>
                  {format.value.toUpperCase()}
                </div>
                <div className="text-sm font-medium text-gray-700">{format.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedFormat && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Selected format: <span className="font-semibold uppercase">{selectedFormat}</span>
          </p>
        </div>
      )}
    </div>
  );
}

