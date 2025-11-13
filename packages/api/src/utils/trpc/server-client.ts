import { createTRPCClient, httpLink, TRPCClient } from '@trpc/client';
import {
  createTRPCOptionsProxy,
  TRPCOptionsProxy,
} from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { getAuthHeaders } from '../supabase/get-auth-headers';
import { createClient } from '../supabase/server-client';
import { makeQueryClient } from './query-client';

import type { AppRouter } from '@/backend/utils/trpc/trpc.router';

async function authenticatedHeaders() {
  const supabaseClient = await createClient();
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  return getAuthHeaders(session);
}

const TRPC_LINK = httpLink({
  url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/trpc`,
  headers: authenticatedHeaders,
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
      links: [TRPC_LINK],
    }),
    queryClient: getQueryClient,
  });

// TRPC client utilisable dans les server actions et les route handlers
export const trpcInServerFunction: TRPCClient<AppRouter> =
  createTRPCClient<AppRouter>({
    links: [TRPC_LINK],
  });
