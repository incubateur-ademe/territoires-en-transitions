import AppHeader from '@/site/components/layout/AppHeader';
import Footer from '@/site/components/layout/Footer';
import { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { ReactNode } from 'react';
import { Trackers } from '../providers/posthog';
import './global.css';
import { getMetaData } from './utils';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const data = await getMetaData();

  return {
    title: {
      default: data?.metaTitle ?? 'Territoires en Transitions',
      template: `%s | ${data?.metaTitle ?? 'Territoires en Transitions'}`,
    },
    description: data?.metaDescription,
    icons: {
      icon: '/favicon.ico',
      other: [
        {
          rel: 'icon',
          url: '/favicon-32x32.png',
          type: 'image/png',
          sizes: '32x32',
        },
        {
          rel: 'icon',
          url: '/favicon-16x16.png',
          type: 'image/png',
          sizes: '16x16',
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
    twitter: {
      card: 'summary_large_image',
    },
    openGraph: {
      title: data?.metaTitle ?? 'Territoires en Transitions',
      description: data?.metaDescription,
      url: 'https://www.territoiresentransitions.fr',
      siteName: data?.metaTitle ?? 'Territoires en Transitions',
      images: data?.metaImage
        ? [
            {
              url: data.metaImage.url,
              width: data.metaImage.width,
              height: data.metaImage.height,
              type: data.metaImage.type,
              alt: data.metaImage.alt,
            },
          ]
        : [],
      locale: 'fr_FR',
      type: 'website',
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce');

  if (!nonce) {
    throw new Error('Nonce is required');
  }

  return (
    <html lang="fr">
      <body className="min-h-screen flex flex-col justify-between">
        <Trackers
          nonce={nonce}
          config={{
            host: process.env.POSTHOG_HOST,
            key: process.env.POSTHOG_KEY,
          }}
        >
          <div className="grow flex flex-col">
            <AppHeader />
            <div className="grow flex flex-col">{children}</div>
          </div>
          <Footer />
        </Trackers>
      </body>
    </html>
  );
}
