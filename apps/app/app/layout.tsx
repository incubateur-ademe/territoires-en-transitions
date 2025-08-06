import { getCookieOptions } from '@/api/utils/supabase/cookie-options';
import { SupabaseProvider } from '@/api/utils/supabase/use-supabase';
import { E2EProvider } from '@/app/app/E2E';
import Footer from '@/app/app/Layout/Footer';
import DataDogInit from '@/app/lib/datadog.init';
import { PostHogProvider } from '@/ui';
import * as Sentry from '@sentry/nextjs';
import type { Metadata } from 'next';
import nextDynamic from 'next/dynamic';
import { headers } from 'next/headers';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import StonlyWidget from '../src/lib/stonly.widget';
import './global.css';

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
  const CrispWithNoSSR = nextDynamic(() => import('../src/lib/crisp.widget'));

  const hostname = (await headers()).get('host');
  const supabaseCookieOptions = getCookieOptions(hostname ?? undefined);

  return (
    <html lang="fr" translate="no" data-fr-scheme="light">
      <body>
        <div id="root">
          <NuqsAdapter>
            <SupabaseProvider cookieOptions={supabaseCookieOptions}>
              <E2EProvider />
              <PostHogProvider
                config={{
                  host: process.env.POSTHOG_HOST,
                  key: process.env.POSTHOG_KEY,
                }}
              >
                {/* L'utilisation de overflow-hidden ou overflow-auto sur le container
              /* empêche l'utilisation de la propriété sticky dans l'app */}
                <div id="main" className="min-h-screen flex flex-col">
                  <div className="flex flex-col grow">{children}</div>
                  <Footer />
                </div>
              </PostHogProvider>
            </SupabaseProvider>
          </NuqsAdapter>
        </div>
        <CrispWithNoSSR />
        <DataDogInit />
        <StonlyWidget />
      </body>
    </html>
  );
}
