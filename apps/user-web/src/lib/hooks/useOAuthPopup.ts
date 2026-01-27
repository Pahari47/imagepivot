'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../api/client';

interface UseOAuthPopupOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useOAuthPopup({ onSuccess, onError }: UseOAuthPopupOptions = {}) {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const openOAuthPopup = useCallback(
    (provider: 'google' | 'facebook') => {
      // The API base URL already includes /api, so we just need /auth/{provider}
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      // If API_URL doesn't include /api, add it
      const apiUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`;
      const authUrl = `${apiUrl}/auth/${provider}`;

      // Open popup window
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        `${provider}Auth`,
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no`
      );

      if (!popup) {
        onError?.('Popup blocked. Please allow popups for this site.');
        return;
      }

      // Listen for messages from the popup
      const messageListener = (event: MessageEvent) => {
        // Verify origin for security
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'OAUTH_SUCCESS') {
          const { token, isNewUser } = event.data;
          
          // Set token and refresh user
          apiClient.setToken(token);
          
          refreshUser().then(() => {
            window.removeEventListener('message', messageListener);
            popup.close();
            
            if (isNewUser) {
              router.push('/dashboard?welcome=true');
            } else {
              router.push('/dashboard');
            }
            
            onSuccess?.();
          }).catch((error) => {
            window.removeEventListener('message', messageListener);
            popup.close();
            onError?.(error.message || 'Authentication failed');
          });
        } else if (event.data.type === 'OAUTH_ERROR') {
          window.removeEventListener('message', messageListener);
          popup.close();
          onError?.(event.data.error || 'Authentication failed');
        }
      };

      window.addEventListener('message', messageListener);

      // Check if popup is closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          onError?.('Authentication cancelled');
        }
      }, 1000);

      return () => {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        if (!popup.closed) {
          popup.close();
        }
      };
    },
    [router, refreshUser, onSuccess, onError]
  );

  return { openOAuthPopup };
}

