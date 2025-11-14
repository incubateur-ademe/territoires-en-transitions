import { ReactQueryAndTRPCProvider, SupabaseProvider } from '@/api';
import { UserProvider } from '@/api/users';
import { getCookieOptions } from '@/api/utils/supabase/cookie-options';
import { Header, PostHogProvider } from '@/ui';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import './global.css';

export const metadata: Metadata = {
  title: 'Territoires en Transitions',
  description:
    'Initiez des actions impactantes et valorisez le chemin déjà parcouru',
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
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hostname = (await headers()).get('host');
  const supabaseCookieOptions = getCookieOptions(hostname ?? undefined);

  return (
    <html lang="fr">
      <body className="min-h-screen overflow-x-visible flex flex-col">
        <div className="flex flex-col grow">
          <SupabaseProvider cookieOptions={supabaseCookieOptions}>
            <UserProvider>
              <ReactQueryAndTRPCProvider>
                <PostHogProvider
                  config={{
                    host: process.env.POSTHOG_HOST,
                    key: process.env.POSTHOG_KEY,
                  }}
                >
                  <Header />
                  <div className="bg-grey-2 grow flex flex-col">
                    <div className="grow">{children}</div>
                  </div>
                </PostHogProvider>
              </ReactQueryAndTRPCProvider>
            </UserProvider>
          </SupabaseProvider>
        </div>
      </body>
    </html>
  );
}
