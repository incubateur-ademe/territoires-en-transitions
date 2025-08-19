import { fetchUserDetails } from '@/api/users/user-details.fetch.server';
import { UserProvider } from '@/api/users/user-provider';
import { getAuthUser } from '@/api/utils/supabase/auth-user.server';
import { getCookieOptions } from '@/api/utils/supabase/cookie-options';
import { SupabaseProvider } from '@/api/utils/supabase/use-supabase';
import { ReactQueryAndTRPCProvider } from '@/api/utils/trpc/client';
import Header from '@/auth/components/Layout/Header';
import { PostHogProvider } from '@/ui';
import { headers } from 'next/headers';
import './global.css';

export const metadata = {
  title: 'Territoires en Transitions',
  description:
    'Initiez des actions impactantes et valorisez le chemin déjà parcouru',
  lang: 'fr',
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

  const authUser = await getAuthUser();

  const user = authUser ? await fetchUserDetails(authUser) : null;

  return (
    <html lang="fr">
      <PostHogProvider
        config={{
          host: process.env.POSTHOG_HOST,
          key: process.env.POSTHOG_KEY,
        }}
      >
        <body className="min-h-screen overflow-x-visible flex flex-col">
          <div className="flex flex-col grow">
            <SupabaseProvider cookieOptions={supabaseCookieOptions}>
              <UserProvider user={user}>
                <ReactQueryAndTRPCProvider>
                  <Header />
                  <div className="bg-grey-2 grow flex flex-col">
                    <div className="grow">{children}</div>
                  </div>
                </ReactQueryAndTRPCProvider>
              </UserProvider>
            </SupabaseProvider>
          </div>
        </body>
      </PostHogProvider>
    </html>
  );
}
