'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../../../../lib/api/client';
import { useAuth } from '../../../../contexts/AuthContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) return;
    
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');
    const isNewUser = searchParams.get('newUser') === 'true';

    if (token) {
      hasProcessed.current = true;
      apiClient.setToken(token);
      refreshUser().then(() => {
        if (isNewUser) {
          router.replace('/dashboard?welcome=true');
        } else {
          router.replace('/dashboard');
        }
      }).catch(() => {
        router.replace('/login?error=oauth_failed');
      });
    } else {
      hasProcessed.current = true;
      router.replace('/login?error=oauth_failed');
    }
  }, [searchParams, router, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}

