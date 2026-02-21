'use client';

import { useState, useEffect, useRef } from 'react';
import { FeatureConfigProps } from '../../../../lib/features/types';
import { useAuth } from '../../../../contexts/AuthContext';
import { apiClient } from '../../../../lib/api/client';

export interface MetadataConfig {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string;
  trackNumber?: number;
  coverArt?: string; // R2 file key
}

export function AudioMetadataConfig({ config, onChange }: FeatureConfigProps) {
  const { user } = useAuth();
  const metadataConfig = config as MetadataConfig;

  const [title, setTitle] = useState<string>(metadataConfig.title || '');
  const [artist, setArtist] = useState<string>(metadataConfig.artist || '');
  const [album, setAlbum] = useState<string>(metadataConfig.album || '');
  const [year, setYear] = useState<string>(metadataConfig.year ? String(metadataConfig.year) : '');
  const [genre, setGenre] = useState<string>(metadataConfig.genre || '');
  const [trackNumber, setTrackNumber] = useState<string>(metadataConfig.trackNumber ? String(metadataConfig.trackNumber) : '');
  const [coverArtKey, setCoverArtKey] = useState<string | undefined>(metadataConfig.coverArt);
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
  const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(metadataConfig.title || '');
    setArtist(metadataConfig.artist || '');
    setAlbum(metadataConfig.album || '');
    setYear(metadataConfig.year ? String(metadataConfig.year) : '');
    setGenre(metadataConfig.genre || '');
    setTrackNumber(metadataConfig.trackNumber ? String(metadataConfig.trackNumber) : '');
    setCoverArtKey(metadataConfig.coverArt);
  }, [metadataConfig]);

  const handleFieldChange = (field: keyof MetadataConfig, value: string | number | undefined) => {
    const newConfig = {
      ...metadataConfig,
      [field]: value || undefined,
    };
    onChange(newConfig);
  };

  const handleCoverArtSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverArtPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setCoverArtFile(file);
    setIsUploadingCover(true);

    try {
      if (!user) {
        throw new Error('Please login to upload cover art');
      }

      const orgResponse = await apiClient.getMyOrg();
      if (!orgResponse.success || !orgResponse.data?.data?.org) {
        throw new Error('Failed to get organization');
      }

      const orgId = orgResponse.data.data.org.id;
      const mimeType = file.type || 'image/jpeg';

      const presignResponse = await apiClient.generatePresignedUrl({
        orgId,
        fileName: file.name,
        fileSize: file.size,
        mimeType,
        mediaType: 'image',
      });

      if (!presignResponse.success || !presignResponse.data?.data) {
        throw new Error(presignResponse.error || 'Failed to generate upload URL');
      }

      const { uploadUrl, key } = presignResponse.data.data;

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': mimeType,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload cover art');
      }

      setCoverArtKey(key);
      handleFieldChange('coverArt', key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload cover art';
      alert(errorMessage);
      setCoverArtFile(null);
      setCoverArtPreview(null);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleRemoveCoverArt = () => {
    setCoverArtFile(null);
    setCoverArtPreview(null);
    setCoverArtKey(undefined);
    handleFieldChange('coverArt', undefined);
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Metadata Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              handleFieldChange('title', e.target.value || undefined);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Track title"
          />
        </div>

        <div>
          <label htmlFor="artist" className="block text-sm font-medium text-gray-700 mb-1">
            Artist
          </label>
          <input
            id="artist"
            type="text"
            value={artist}
            onChange={(e) => {
              setArtist(e.target.value);
              handleFieldChange('artist', e.target.value || undefined);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Artist name"
          />
        </div>

        <div>
          <label htmlFor="album" className="block text-sm font-medium text-gray-700 mb-1">
            Album
          </label>
          <input
            id="album"
            type="text"
            value={album}
            onChange={(e) => {
              setAlbum(e.target.value);
              handleFieldChange('album', e.target.value || undefined);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Album name"
          />
        </div>

        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <input
            id="year"
            type="number"
            min="1900"
            max="2100"
            value={year}
            onChange={(e) => {
              const value = e.target.value;
              setYear(value);
              handleFieldChange('year', value ? parseInt(value, 10) : undefined);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Release year"
          />
        </div>

        <div>
          <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-1">
            Genre
          </label>
          <input
            id="genre"
            type="text"
            value={genre}
            onChange={(e) => {
              setGenre(e.target.value);
              handleFieldChange('genre', e.target.value || undefined);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="e.g., Rock, Pop, Jazz"
          />
        </div>

        <div>
          <label htmlFor="trackNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Track Number
          </label>
          <input
            id="trackNumber"
            type="number"
            min="1"
            value={trackNumber}
            onChange={(e) => {
              const value = e.target.value;
              setTrackNumber(value);
              handleFieldChange('trackNumber', value ? parseInt(value, 10) : undefined);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Track number"
          />
        </div>
      </div>

      {/* Cover Art Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cover Art (Optional)
        </label>
        {coverArtPreview || coverArtKey ? (
          <div className="relative inline-block">
            <img
              src={coverArtPreview || `#`}
              alt="Cover art preview"
              className="w-48 h-48 object-cover rounded-lg border border-gray-300"
              onError={(e) => {
                // If preview fails, try to load from R2 (would need a URL endpoint)
                e.currentTarget.style.display = 'none';
              }}
            />
            <button
              type="button"
              onClick={handleRemoveCoverArt}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverArtSelect}
              className="hidden"
              id="coverArtInput"
            />
            <label
              htmlFor="coverArtInput"
              className="cursor-pointer flex flex-col items-center"
            >
              <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-600">
                {isUploadingCover ? 'Uploading...' : 'Click to upload cover art (JPG, PNG)'}
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Metadata Editing:</span> Add or edit ID3 tags and cover art for your audio file. 
          Supported formats: MP3, M4A, FLAC, OGG. All fields are optional - only fill in what you want to change.
        </p>
      </div>
    </div>
  );
}

