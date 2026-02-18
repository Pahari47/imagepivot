'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiClient } from '../../lib/api/client';

interface ToolHeaderProps {
  mediaType: 'image' | 'audio' | 'video';
  featureSlug?: string;
}

export function ToolHeader({ mediaType, featureSlug }: ToolHeaderProps) {
  const pathname = usePathname();
  const [featureTitle, setFeatureTitle] = useState<string>('');

  const tabs = [
    { id: 'image', label: 'Image', path: '/image/resize' },
    { id: 'audio', label: 'audio', path: '/audio/quality' },
    { id: 'video', label: 'video', path: '/video/quality' },
  ];

  useEffect(() => {
    if (featureSlug) {
      // Convert feature slug to API format (e.g., 'resize' -> 'image.resize')
      const apiSlug = `${mediaType}.${featureSlug}`;
      
      apiClient.getFeatureBySlug(apiSlug).then((response) => {
        if (response.success && response.data?.data) {
          setFeatureTitle(response.data.data.title);
        }
      }).catch(() => {
        // Fallback to capitalized feature slug if API call fails
        setFeatureTitle(featureSlug.charAt(0).toUpperCase() + featureSlug.slice(1));
      });
    }
  }, [featureSlug, mediaType]);

  return (
    <div className="bg-gray-50 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {featureTitle && (
            <span className="text-gray-900 mt-5 font-medium text-lg">{featureTitle}</span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(`/${tab.id}`);
            return (
              <Link
                key={tab.id}
                href={tab.path}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

