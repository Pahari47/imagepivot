'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api/client';

interface QuotaInfo {
  limit: number;
  used: number;
  remaining: number;
  resetAt: string;
}

interface ToolSidebarProps {
  mediaType: 'image' | 'audio' | 'video';
  activeFeature: string;
}

export function ToolSidebar({ mediaType, activeFeature }: ToolSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);

  // Image features (hardcoded for now)
  const imageFeatures = [
    { id: 'quality', name: 'Image Quality', icon: '📈' },
    { id: 'resize', name: 'Image Resize', icon: '↔️' },
    { id: 'convert-png', name: 'Convert PNG', icon: '🔄' },
    { id: 'convert-jpg', name: 'Convert JPG', icon: '🔄' },
  ];

  // Audio features (placeholder)
  const audioFeatures = [
    { id: 'quality', name: 'Audio Quality', icon: '📈' },
    { id: 'convert', name: 'Convert Format', icon: '🔄' },
  ];

  // Video features (placeholder)
  const videoFeatures = [
    { id: 'quality', name: 'Video Quality', icon: '📈' },
    { id: 'convert', name: 'Convert Format', icon: '🔄' },
  ];

  const features = mediaType === 'image' ? imageFeatures : mediaType === 'audio' ? audioFeatures : videoFeatures;

  useEffect(() => {
    if (user) {
      // Fetch quota info
      apiClient.getQuotaInfo().then((response) => {
        if (response.success && response.data?.data) {
          setQuotaInfo(response.data.data);
        }
      });
    }
  }, [user]);

  const quotaPercentage = quotaInfo ? (quotaInfo.used / quotaInfo.limit) * 100 : 0;

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-green-600 text-xl font-semibold">Imagepivot</span>
        </Link>
      </div>

      {/* Features List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {features.map((feature) => {
            const isActive = activeFeature === feature.id;
            const featurePath = `/${mediaType}/${feature.id}`;

            return (
              <Link
                key={feature.id}
                href={featurePath}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-red-50 text-red-600 border-l-4 border-red-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{feature.icon}</span>
                <span className="font-medium">{feature.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-200 p-4 space-y-4">
        {/* Quota Progress Bar */}
        {user && quotaInfo && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Credit left</span>
              <span className="text-gray-900 font-medium">
                {quotaInfo.remaining}MB / {quotaInfo.limit}MB
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {!user && (
          <Link
            href="/"
            className="block w-full text-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Buy Premium
          </Link>
        )}

        {/* Navigation Links */}
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span>📊</span>
            <span>Dashboard</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </Link>
        </div>

        {/* User Profile */}
        {user && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm">
                  {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 text-sm w-full px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <span>←</span>
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

