'use client';

import { AuthProviderWrapper } from '../../components/providers/AuthProviderWrapper';
import { ExpandableSidebar } from '../../components/layout/ExpandableSidebar';
import { ToolHeader } from '../../components/layout/ToolHeader';
import { usePathname } from 'next/navigation';

export default function ImageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const feature = pathname.split('/').pop() || 'resize';

  return (
    <AuthProviderWrapper>
      <div className="flex h-screen bg-gray-50">
        <ExpandableSidebar mediaType="image" activeFeature={feature} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <ToolHeader mediaType="image" featureSlug={feature} />
          {children}
        </div>
      </div>
    </AuthProviderWrapper>
  );
}


