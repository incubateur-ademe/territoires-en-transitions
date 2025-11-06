import { getAuthHeaders } from '@/api/utils/supabase/get-auth-headers';
import { createClient } from '@/api/utils/supabase/server-client';
import { createTRPCClient, httpLink } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { makeQueryClient } from './query-client';

// eslint-disable-next-line @nx/enforce-module-boundaries
import type { AppRouter } from '../../../../../apps/backend/dist/utils/trpc/trpc.router.d';

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
export const trpcInServerComponent = createTRPCOptionsProxy({
  client: createTRPCClient<AppRouter>({
    links: [TRPC_LINK],
  }),
  queryClient: getQueryClient,
});

// TRPC client utilisable dans les server actions et les route handlers
export const trpcInServerFunction = createTRPCClient<AppRouter>({
  links: [TRPC_LINK],
});
