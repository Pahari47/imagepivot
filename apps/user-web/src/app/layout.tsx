import './global.css';
import { AuthProvider } from '../contexts/AuthContext';

export const metadata = {
  title: 'ImagePivot - Media Conversion Platform',
  description: 'Convert images, audio, and video files with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
