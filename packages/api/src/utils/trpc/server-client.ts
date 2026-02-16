import {
  createTRPCClient,
  httpLink,
  loggerLink,
  Operation,
  TRPCClient,
} from '@trpc/client';
import {
  createTRPCOptionsProxy,
  TRPCOptionsProxy,
} from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { getAuthHeaders } from '../supabase/get-auth-headers';
import { createClient } from '../supabase/server-client';
import { makeQueryClient } from './query-client';

import type { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import { getErrorMessage } from '@tet/domain/utils';

async function authenticatedHeaders(args: { op: Operation }) {
  const correlationId = crypto.randomUUID();
  args.op.context = {
    ...(args.op.context ?? {}),
    correlationId,
  };
  const supabaseClient = await createClient();
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  const authHeaders = getAuthHeaders(session);
  return {
    ...authHeaders,
    'x-correlation-id': correlationId,
  };
}

const TRPC_LINK = httpLink({
  url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/trpc`,
  headers: (args) => authenticatedHeaders(args),
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
          enabled: (op) =>
            op.direction === 'down' && op.result instanceof Error,
          logger(op) {
            const correlationId = (op.context as any)?.correlationId;
            if (op.direction === 'down' && op.result instanceof Error) {
              console.error(
                `[${correlationId}] tRPC error for path ${
                  op.path
                } with data ${JSON.stringify(
                  op.result.data ?? {}
                )}: ${getErrorMessage(op.result)}`
              );
            }
          },
        }),
        TRPC_LINK,
      ],
    }),
    queryClient: getQueryClient,
  });

// TRPC client utilisable dans les server actions et les route handlers
export const trpcInServerFunction: TRPCClient<AppRouter> =
  createTRPCClient<AppRouter>({
    links: [TRPC_LINK],
  });
