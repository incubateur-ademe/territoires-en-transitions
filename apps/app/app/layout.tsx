import * as Sentry from '@sentry/nextjs';
import type { Metadata } from 'next';
import './global.css';
import RootProviders from './root-providers';

export const dynamic = 'force-dynamic';

const shared = {
  title: 'Territoires en Transitions',
  description: "Prioriser - Mettre en œuvre - Planifier - Suivre l'impact",
};

const metadata: Metadata = {
  metadataBase: new URL('https://app.territoiresentransitions.fr'),
  title: shared.title,
  description: shared.description,
  robots: {
    index: true,
    follow: true,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
  icons: {
    icon: [
      {
        sizes: '16x16',
        url: '/favicon-16x16.png',
      },
      {
        sizes: '32x32',
        url: '/favicon-32x32.png',
      },
    ],
  },
  openGraph: {
    title: shared.title,
    description: shared.description,
    url: 'https://app.territoiresentransitions.fr',
    siteName: shared.title,
    locale: 'fr_FR',
    images: [
      {
        url: '/territoires_en_transitions.png',
        width: 491,
        height: 439,
        alt: shared.title,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: shared.title,
    description: shared.description,
    images: {
      url: 'https://app.territoiresentransitions.fr/territoires_en_transitions.png', // Must be an absolute URL
      width: 491,
      height: 439,
    },
  },
};

export function generateMetadata(): Metadata {
  return {
    ...metadata,
    other: {
      // Enable Sentry distributed tracing for App Router
      ...Sentry.getTraceData(),
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" translate="no" data-fr-scheme="light">
      <body>
        <div id="root">
          <RootProviders>
            {/* L'utilisation de overflow-hidden ou overflow-auto sur le container
       empêche l'utilisation de la propriété sticky dans l'app, ne pas l'utiliser sur cette div */}
            <div id="main" className="min-h-screen flex flex-col bg-grey-2">
              {children}
            </div>
          </RootProviders>
        </div>
      </body>
    </html>
  );
}
