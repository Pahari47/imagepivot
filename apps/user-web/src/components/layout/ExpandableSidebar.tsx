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
  icon: string; // Image path or URL
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
          // Map feature IDs to icon image paths
          // You can customize these paths to point to specific icons
          const iconMap: Record<string, string> = {
            resize: '/icons/feature-icon.svg',
            compress: '/icons/feature-icon.svg',
            convert: '/icons/feature-icon.svg',
            quality: '/icons/feature-icon.svg',
            crop: '/icons/feature-icon.svg',
          };
          return {
            id,
            name: f.title,
            icon: iconMap[id] || '/icons/feature-icon.svg', // Default icon image
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
  const width = isExpanded ? 'w-64' : 'w-24';

  return (
    <div className={`${width} bg-white border-r border-gray-300 flex flex-col h-screen transition-all duration-300 relative`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-10 z-10 bg-white border border-gray-300 rounded-lg pl-2.5 pr-2.5 hover:bg-gray-200 transition-colors"
        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <span className="text-gray-300 text-sm">
          {isExpanded ? '|⇦' : '➜|'}
        </span>
      </button>

      {/* Logo */}
      <div className="p-4">
        <Link href="/" className="flex justify-center">
          <span className="text-green-500 text-xl font-semibold">
            {isExpanded ? 'Imagepivot' : 'IP'}
          </span>
        </Link>
      </div>

      {/* Features List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loadingFeatures ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300"></div>
            {isExpanded && (
              <p className="mt-2 text-sm text-gray-700">Loading...</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {features.length === 0 ? (
              isExpanded && (
                <p className="text-sm text-gray-700 text-center py-4">No features available</p>
              )
            ) : (
              features.map((feature) => {
                const isActive = activeFeature === feature.id;
                const featurePath = `/${mediaType}/${feature.id}`;

                return (
                  <Link
                    key={feature.id}
                    href={featurePath}
                    className={`${
                      isExpanded 
                        ? 'flex items-center space-x-3 px-4 py-3' 
                        : 'flex flex-col items-center justify-center px-2 py-2'
                    } rounded-lg transition-colors ${
                      isActive
                        ? 'bg-gray-300 text-gray-700'
                        : 'text-gray-700 hover:bg-gray-300'
                    }`}
                    title={!isExpanded ? feature.name : undefined}
                  >
                    <img 
                      src={feature.icon} 
                      alt={feature.name}
                      className={`${isExpanded ? 'w-5 h-5' : 'w-5 h-5'} flex-shrink-0 object-contain`}
                      onError={(e) => {
                        // Fallback to a default icon if image fails to load
                        (e.target as HTMLImageElement).src = '/icons/feature-icon.svg';
                      }}
                    />
                    {isExpanded ? (
                      <span className="font-medium truncate">{feature.name}</span>
                    ) : (
                      <span className="text-[10px] font-medium truncate mt-1 text-center leading-tight">
                        {feature.id}
                      </span>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="p-4 space-y-4">
        {/* Quota Progress Bar */}
        {user && quotaInfo && isExpanded && (
          <div className="space-y-2">
            <div className="flex justify-center text-sm">
              <span className="text-gray-400">Credit left</span>
              {/* <span className="text-gray-200 font-medium">
                {quotaInfo.remaining}MB / {quotaInfo.limit}MB
              </span> */}
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Buy Premium Button */}
        {isExpanded && (
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
              className="flex items-center space-x-3 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300 rounded-lg transition-colors"
            >
              <img 
                src="/icons/feature-icon.svg" 
                alt="Dashboard"
                className="w-5 h-5 flex-shrink-0 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/icons/feature-icon.svg';
                }}
              />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center space-x-3 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300 rounded-lg transition-colors"
            >
              <img 
                src="/icons/feature-icon.svg" 
                alt="Settings"
                className="w-5 h-5 flex-shrink-0 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/icons/feature-icon.svg';
                }}
              />
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
                  <p className="text-sm font-medium text-gray-700 truncate">{user.name || 'User'}</p>
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

