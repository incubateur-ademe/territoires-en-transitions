import AppHeader from './AppHeader';
import '@gouvfr/dsfr/dist/dsfr.css';
import './global.css';
import {Footer} from '@components/footer/Footer';
import {Metadata} from 'next';
import {headers} from 'next/headers';
import {getMetaData} from './utils';

export async function generateMetadata(): Promise<Metadata> {
  const data = await getMetaData();
  const headersList = headers();
  const baseUrl = headersList.get('host') ?? '';
  const pathname = headersList.get('x-invoke-path') ?? '';

  return {
    title: {
      default: data.title ?? 'Territoires en Transitions',
      template: `%s | ${data.title ?? 'Territoires en Transitions'}`,
    },
    description: data.description,
    viewport: {
      width: 'device-width',
      initialScale: 1,
    },
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
      title: data.title ?? 'Territoires en Transitions',
      description: data.description,
      url: `${baseUrl}${pathname !== '/' ? pathname : ''}`,
      siteName: data.title ?? 'Territoires en Transitions',
      images: data.image
        ? [
            {
              url: data.image.url,
              width: data.image.width,
              height: data.image.height,
              type: data.image.type,
              alt: data.image.alt,
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
    <html>
      <body className="min-h-screen flex flex-col justify-between">
        <div>
          <AppHeader />
          <div className="fr-container-fluid">{children}</div>
        </div>
        <Footer />
      </body>
    </html>
  );
}
