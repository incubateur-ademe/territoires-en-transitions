import {
  createTRPCClient,
  httpLink,
  loggerLink,
  TRPCClient,
} from '@trpc/client';
import {
  createTRPCOptionsProxy,
  TRPCOptionsProxy,
} from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { makeQueryClient } from './react-query-client';

import type { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import { supabaseUrlToAuthCookieName } from '@tet/domain/utils';
import { cookies } from 'next/headers';
import { ENV } from '../../environmentVariables';
import { getTrpcUrl } from './get-trpc-url.utils';

async function getSupabaseCookieHeader() {
  const cookieStore = await cookies();

  const supabaseCookieName = supabaseUrlToAuthCookieName(
    ENV.supabase_url ?? ''
  );
  const supabaseJwt = cookieStore.get(supabaseCookieName)?.value;

  return {
    Cookie: `${supabaseCookieName}=${supabaseJwt}`,
  };
}

const SERVER_HTTP_LINK = httpLink({
  url: getTrpcUrl(),
  headers: getSupabaseCookieHeader,
});

// IMPORTANT: Create a stable getter for the query client that
// will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

// TRPC client utilisable dans les RSC avec le QueryClient
// ce qui permet de partager la data entre server et front,
// ou bien de faire du prefetching
export const trpcInServerComponent: TRPCOptionsProxy<AppRouter> =
  createTRPCOptionsProxy({
    client: createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: () => true,
        }),
        SERVER_HTTP_LINK,
      ],
    }),
    queryClient: getQueryClient,
  });

// TRPC client utilisable dans les server actions et les route handlers
export const trpcInServerFunction: TRPCClient<AppRouter> =
  createTRPCClient<AppRouter>({
    links: [SERVER_HTTP_LINK],
  });
