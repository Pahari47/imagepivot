'use client';

import { useState, useEffect } from 'react';
import { FeatureConfigProps } from '../../../../lib/features/types';

export interface CompressConfig {
  bitrate?: number;
  vbr?: boolean;
  sampleRate?: number;
  format?: string;
}

const COMPRESS_FORMATS = [
  { value: 'mp3', label: 'MP3', defaultBitrate: 192 },
  { value: 'aac', label: 'AAC', defaultBitrate: 160 },
  { value: 'ogg', label: 'OGG', defaultBitrate: 192 },
  { value: 'm4a', label: 'M4A', defaultBitrate: 160 },
];

const SAMPLE_RATES = [
  { value: 48000, label: '48 kHz', description: 'High quality (default)' },
  { value: 44100, label: '44.1 kHz', description: 'CD quality' },
  { value: 22050, label: '22.05 kHz', description: 'Good quality, smaller size' },
  { value: 16000, label: '16 kHz', description: 'Voice quality, smaller size' },
  { value: 11025, label: '11.025 kHz', description: 'Low quality, very small' },
  { value: 8000, label: '8 kHz', description: 'Telephone quality, smallest' },
];

export function AudioCompressConfig({ config, onChange, selectedFile }: FeatureConfigProps) {
  const compressConfig = config as CompressConfig;

  const [bitrate, setBitrate] = useState<number>(compressConfig.bitrate || 192);
  const [vbr, setVbr] = useState<boolean>(compressConfig.vbr || false);
  const [sampleRate, setSampleRate] = useState<number | undefined>(compressConfig.sampleRate);
  const [format, setFormat] = useState<string>(compressConfig.format || 'mp3');

  // Calculate estimated file size
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);

  useEffect(() => {
    setBitrate(compressConfig.bitrate || 192);
    setVbr(compressConfig.vbr || false);
    setSampleRate(compressConfig.sampleRate);
    setFormat(compressConfig.format || 'mp3');
  }, [compressConfig.bitrate, compressConfig.vbr, compressConfig.sampleRate, compressConfig.format]);

  // Calculate estimated output size
  useEffect(() => {
    if (selectedFile) {
      // Estimate: File Size (MB) ≈ (bitrate * duration) / (8 * 1024)
      // We need duration, but we don't have it. Use a rough estimate based on input file size.
      // For compression, assume 30-50% reduction from original for lossy compression
      const originalSizeMB = selectedFile.size / 1024 / 1024;
      // Rough estimate: compressed size ≈ (bitrate / original_bitrate) * original_size
      // Assuming original is ~192k, compressed at selected bitrate
      const estimatedReduction = bitrate / 192; // Ratio
      const estimatedMB = originalSizeMB * estimatedReduction * 0.8; // 0.8 factor for compression efficiency
      setEstimatedSize(estimatedMB);
    }
  }, [selectedFile, bitrate, vbr, sampleRate]);

  const handleBitrateChange = (value: number) => {
    setBitrate(value);
    onChange({
      ...compressConfig,
      bitrate: value,
    });
  };

  const handleVbrChange = (value: boolean) => {
    setVbr(value);
    onChange({
      ...compressConfig,
      vbr: value,
    });
  };

  const handleSampleRateChange = (value: number | undefined) => {
    setSampleRate(value);
    onChange({
      ...compressConfig,
      sampleRate: value,
    });
  };

  const handleFormatChange = (value: string) => {
    setFormat(value);
    const formatDetails = COMPRESS_FORMATS.find(f => f.value === value);
    const newBitrate = formatDetails?.defaultBitrate || 192;
    setBitrate(newBitrate);
    onChange({
      ...compressConfig,
      format: value,
      bitrate: newBitrate,
    });
  };

  return (
    <div className="space-y-6">
      {/* Format Selection */}
      <div>
        <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
          Output Format
        </label>
        <select
          id="format"
          value={format}
          onChange={(e) => handleFormatChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {COMPRESS_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Bitrate Control */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="bitrate" className="block text-sm font-medium text-gray-700">
            Bitrate: {bitrate} kbps
          </label>
          {estimatedSize && (
            <span className="text-xs text-gray-500">
              Estimated: ~{estimatedSize.toFixed(2)} MB
            </span>
          )}
        </div>
        <input
          id="bitrate"
          type="range"
          min="64"
          max="320"
          step="16"
          value={bitrate}
          onChange={(e) => handleBitrateChange(parseInt(e.target.value, 10))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>64 kbps (Smallest)</span>
          <span>192 kbps (Balanced)</span>
          <span>320 kbps (Highest)</span>
        </div>
      </div>

      {/* VBR Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label htmlFor="vbr" className="block text-sm font-medium text-gray-700">
            Variable Bitrate (VBR)
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Better quality at the same file size (recommended)
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id="vbr"
            checked={vbr}
            onChange={(e) => handleVbrChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
        </label>
      </div>

      {/* Sample Rate (Optional) */}
      <div>
        <label htmlFor="sampleRate" className="block text-sm font-medium text-gray-700 mb-1">
          Sample Rate (Optional)
        </label>
        <select
          id="sampleRate"
          value={sampleRate || ''}
          onChange={(e) => handleSampleRateChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Keep original</option>
          {SAMPLE_RATES.map((sr) => (
            <option key={sr.value} value={sr.value}>
              {sr.label} - {sr.description}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Lower sample rates reduce file size but may affect quality
        </p>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Compression Tips:</span> Lower bitrates and sample rates reduce file size but may affect audio quality. VBR provides better quality at the same file size.
        </p>
      </div>
    </div>
  );
}

