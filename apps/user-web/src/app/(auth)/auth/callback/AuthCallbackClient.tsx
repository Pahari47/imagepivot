'use client';

import { useEffect, useRef } from 'react';

export function AuthCallbackClient() {
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const isNewUser = urlParams.get('newUser') === 'true';
    const isPopup = window.opener && window.opener !== window;

    if (token) {
      hasProcessed.current = true;
      if (isPopup) {
        window.opener?.postMessage(
          { type: 'OAUTH_SUCCESS', token, isNewUser: isNewUser === true },
          window.location.origin
        );
        setTimeout(() => window.close(), 100);
      } else {
        if (window.localStorage) {
          window.localStorage.setItem('auth_token', token);
        }
        window.location.href = isNewUser ? '/dashboard?welcome=true' : '/dashboard';
      }
    } else {
      hasProcessed.current = true;
      if (isPopup) {
        window.opener?.postMessage({ type: 'OAUTH_ERROR', error: 'No token received' }, window.location.origin);
        setTimeout(() => window.close(), 100);
      } else {
        window.location.href = '/?error=oauth_failed';
      }
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #f3f4f6', borderTop: '4px solid #16a34a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem', color: '#4b5563' }}>Completing authentication...</p>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

