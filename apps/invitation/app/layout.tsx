import type { Metadata, Viewport } from 'next';
import './globals.css';
import './mobile-viewport-fix.css';
import Providers from './providers';
import { DEFAULT_METADATA } from '@/lib/siteMetadata';
import GoogleAnalytics from '@/components/common/GoogleAnalytics';

export const metadata: Metadata = {
  title: DEFAULT_METADATA.title,
  description: DEFAULT_METADATA.description,
  metadataBase: new URL(DEFAULT_METADATA.baseUrl),
  openGraph: {
    title: DEFAULT_METADATA.title,
    description: DEFAULT_METADATA.description,
    siteName: DEFAULT_METADATA.siteName,
    url: DEFAULT_METADATA.baseUrl,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_METADATA.title,
    description: DEFAULT_METADATA.description,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <GoogleAnalytics />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
