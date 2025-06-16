import { getAuthHeaders } from '@/api/utils/supabase/get-auth-headers';
import { createClient } from '@/api/utils/supabase/server-client';
import type { AppRouter } from '@/domain/trpc-router';
import { createTRPCClient, httpLink } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { makeQueryClient } from './query-client';

// IMPORTANT: Create a stable getter for the query client that
// will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

// TRPC client utilisable dans les RSC et les server actions
export const trpcServer = createTRPCOptionsProxy({
  client: createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/trpc`,
        async headers() {
          const supabaseClient = await createClient();
          const {
            data: { session },
          } = await supabaseClient.auth.getSession();

          return getAuthHeaders(session);
        },
      }),
    ],
  }),
  queryClient: getQueryClient,
});
