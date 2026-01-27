'use client';

// Global error page - completely isolated, no layout, no providers
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // This page completely replaces the root layout
  // No contexts, no providers, just plain HTML
  return (
    <html lang="en">
      <head>
        <meta key="charset" charSet="utf-8" />
        <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1" />
        <title key="title">Error - ImagePivot</title>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
              Something went wrong!
            </h1>
            <p style={{ color: '#4b5563', marginBottom: '2rem' }}>
              {error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#4338ca';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#4f46e5';
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

