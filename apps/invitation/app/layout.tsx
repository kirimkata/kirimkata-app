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
  icons: {
    icon: '/k_logo.png',
    shortcut: '/k_logo.png',
    apple: '/k_logo.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: DEFAULT_METADATA.title,
    description: DEFAULT_METADATA.description,
    siteName: DEFAULT_METADATA.siteName,
    url: DEFAULT_METADATA.baseUrl,
    type: 'website',
    images: [
      {
        url: '/k_logo.png',
        width: 1200,
        height: 630,
        alt: DEFAULT_METADATA.title,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_METADATA.title,
    description: DEFAULT_METADATA.description,
    images: ['/k_logo.png'],
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
