import { UserProvider } from '@/api/users/user-context/user-provider';
import { getCookieOptions } from '@/api/utils/supabase/cookie-options';
import { SupabaseProvider } from '@/api/utils/supabase/use-supabase';
import { ReactQueryAndTRPCProvider } from '@/api/utils/trpc/client';
import { PostHogProvider } from '@/ui';
import { headers } from 'next/headers';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import ThirdPartyProviders from './third-party-providers';

export default async function RootProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const hostname = (await headers()).get('host');
  const supabaseCookieOptions = getCookieOptions(hostname ?? undefined);

  return (
    <SupabaseProvider cookieOptions={supabaseCookieOptions}>
      <UserProvider>
        <PostHogProvider
          config={{
            host: process.env.POSTHOG_HOST,
            key: process.env.POSTHOG_KEY,
          }}
        >
          <ReactQueryAndTRPCProvider>
            <NuqsAdapter>
              {/* L'utilisation de overflow-hidden ou overflow-auto sur le container
empêche l'utilisation de la propriété sticky dans l'app, ne pas l'utiliser sur cette div */}
              <div id="main" className="min-h-screen flex flex-col bg-grey-2">
                {children}
              </div>
            </NuqsAdapter>
          </ReactQueryAndTRPCProvider>
        </PostHogProvider>

        <ThirdPartyProviders />
      </UserProvider>
    </SupabaseProvider>
  );
}
