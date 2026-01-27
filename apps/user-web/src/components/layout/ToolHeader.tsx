'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ToolHeaderProps {
  mediaType: 'image' | 'audio' | 'video';
}

export function ToolHeader({ mediaType }: ToolHeaderProps) {
  const pathname = usePathname();

  const tabs = [
    { id: 'image', label: 'Image', path: '/image/quality' },
    { id: 'audio', label: 'audio', path: '/audio/quality' },
    { id: 'video', label: 'video', path: '/video/quality' },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-green-600">✓</span>
          <span className="text-gray-400">→</span>
          <span className="text-gray-900 font-medium capitalize">{mediaType} Quality</span>
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
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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

