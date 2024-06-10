import './global.css';
import AppHeader from './AppHeader';
import {Metadata, Viewport} from 'next';
import {getMetaData} from './utils';
import Footer from '@components/layout/Footer';
import {PHProvider} from 'providers/posthog';
import TrackPage from './TrackPage';

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

export default function RootLayout({children}: {children: JSX.Element}) {
  return (
    <PHProvider>
      <html>
        <body className="min-h-screen flex flex-col justify-between">
          <div className="grow flex flex-col">
            <AppHeader />
            <div className="grow flex flex-col">{children}</div>
          </div>
          <Footer />
          <TrackPage />
        </body>
      </html>
    </PHProvider>
  );
}
