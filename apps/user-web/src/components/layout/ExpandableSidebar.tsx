'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api/client';

interface QuotaInfo {
  limit: number;
  used: number;
  remaining: number;
  resetAt: string;
}

interface ExpandableSidebarProps {
  mediaType: 'image' | 'audio' | 'video';
  activeFeature?: string;
}

interface Feature {
  id: string;
  name: string;
  icon: string;
  slug: string;
}

export function ExpandableSidebar({ mediaType, activeFeature }: ExpandableSidebarProps) {
  const { user, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState(true);

  // Fetch features for the current media type
  useEffect(() => {
    const mediaTypeUpper = mediaType.toUpperCase() as 'IMAGE' | 'AUDIO' | 'VIDEO';
    setLoadingFeatures(true);
    
    apiClient.getFeatures(mediaTypeUpper).then((response) => {
      if (response.success && response.data?.data) {
        const mappedFeatures = response.data.data.map((f) => {
          const slugParts = f.slug.split('.');
          const id = slugParts.length > 1 ? slugParts[1] : f.slug;
          const iconMap: Record<string, string> = {
            resize: '↔️',
            compress: '🗜️',
            convert: '🔄',
            quality: '📈',
            crop: '✂️',
          };
          return {
            id,
            name: f.title,
            icon: iconMap[id] || '🖼️',
            slug: f.slug,
          };
        });
        setFeatures(mappedFeatures);
      } else {
        setFeatures([]);
      }
      setLoadingFeatures(false);
    }).catch(() => {
      setFeatures([]);
      setLoadingFeatures(false);
    });
  }, [mediaType]);

  useEffect(() => {
    if (user) {
      apiClient.getQuotaInfo().then((response) => {
        if (response.success && response.data?.data) {
          setQuotaInfo(response.data.data);
        }
      });
    }
  }, [user]);

  const quotaPercentage = quotaInfo ? (quotaInfo.used / quotaInfo.limit) * 100 : 0;
  const width = isExpanded ? 'w-64' : 'w-20';

  return (
    <div className={`${width} bg-gray-800 border-r border-gray-700 flex flex-col h-screen transition-all duration-300 relative`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-4 z-10 bg-gray-800 border border-gray-700 rounded-full p-1.5 hover:bg-gray-700 transition-colors"
        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <span className="text-gray-300 text-sm">
          {isExpanded ? '◀' : '▶'}
        </span>
      </button>

      {/* Logo */}
      <div className="p-4 border-b border-gray-700">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-green-500 text-xl font-semibold">
            {isExpanded ? 'Imagepivot' : 'IP'}
          </span>
        </Link>
      </div>

      {/* Features List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loadingFeatures ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
            {isExpanded && (
              <p className="mt-2 text-sm text-gray-400">Loading...</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {features.length === 0 ? (
              isExpanded && (
                <p className="text-sm text-gray-400 text-center py-4">No features available</p>
              )
            ) : (
              features.map((feature) => {
                const isActive = activeFeature === feature.id;
                const featurePath = `/${mediaType}/${feature.id}`;

                return (
                  <Link
                    key={feature.id}
                    href={featurePath}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-red-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                    title={!isExpanded ? feature.name : undefined}
                  >
                    <span className="text-xl flex-shrink-0">{feature.icon}</span>
                    {isExpanded && (
                      <span className="font-medium truncate">{feature.name}</span>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-700 p-4 space-y-4">
        {/* Quota Progress Bar */}
        {user && quotaInfo && isExpanded && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Credit left</span>
              <span className="text-gray-200 font-medium">
                {quotaInfo.remaining}MB / {quotaInfo.limit}MB
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {!user && isExpanded && (
          <Link
            href="/"
            className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Buy Premium
          </Link>
        )}

        {/* Navigation Links */}
        {isExpanded && (
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span>📊</span>
              <span>Dashboard</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </Link>
          </div>
        )}

        {/* User Profile */}
        {user && (
          <div className={`pt-4 border-t border-gray-700 ${!isExpanded ? 'flex flex-col items-center' : ''}`}>
            <div className={`flex items-center ${isExpanded ? 'space-x-3 mb-3' : 'justify-center mb-2'}`}>
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-gray-200 text-sm">
                  {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </span>
              </div>
              {isExpanded && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{user.name || 'User'}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              )}
            </div>
            <button
              onClick={logout}
              className={`flex items-center ${isExpanded ? 'space-x-2' : 'justify-center'} text-gray-400 hover:text-gray-200 text-sm w-full px-4 py-2 hover:bg-gray-700 rounded-lg transition-colors`}
              title={!isExpanded ? 'Log out' : undefined}
            >
              <span>←</span>
              {isExpanded && <span>Log out</span>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

