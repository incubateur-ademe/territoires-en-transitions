import { Metadata } from 'next';
import nextDynamic from 'next/dynamic';
import StonlyWidget from '../src/lib/stonly.widget';
import './global.css';

export const dynamic = 'force-dynamic';

const shared = {
  title: 'Territoires en Transitions',
  description: "Prioriser - Mettre en œuvre - Planifier - Suivre l'impact",
};

export const metadata: Metadata = {
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const CrispWithNoSSR = nextDynamic(() => import('../src/lib/crisp.widget'));

  return (
    <html lang="fr" translate="no" data-fr-scheme="light">
      <body>
        <div id="root">
          {/* L'utilisation de overflow-hidden ou overflow-auto sur le container
           /* empêche l'utilisation de la propriété sticky dans l'app */}
          <div className="h-screen w-screen flex flex-col">
            <div id="main" className="grow flex flex-col w-full">
              {children}
            </div>
          </div>
        </div>
        <CrispWithNoSSR />
        <StonlyWidget />
      </body>
    </html>
  );
}
