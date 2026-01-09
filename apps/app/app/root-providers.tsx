import { SupabaseProvider, TrpcWithReactQueryProvider } from '@tet/api';
import { UserProvider } from '@tet/api/users';
import { getCookieOptions } from '@tet/api/utils/supabase/cookie-options';
import { PostHogProvider } from '@tet/ui';
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
          <TrpcWithReactQueryProvider>
            <NuqsAdapter>
              {/* L'utilisation de overflow-hidden ou overflow-auto sur le container
empêche l'utilisation de la propriété sticky dans l'app, ne pas l'utiliser sur cette div */}
              <div id="main" className="min-h-screen flex flex-col bg-grey-2">
                {children}
              </div>
            </NuqsAdapter>
          </TrpcWithReactQueryProvider>
        </PostHogProvider>

        <ThirdPartyProviders />
      </UserProvider>
    </SupabaseProvider>
  );
}
