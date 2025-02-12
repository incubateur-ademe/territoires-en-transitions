'use client';

import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, httpLink, splitLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { useMemo } from 'react';
import { makeQueryClient } from './query-client';

// By using `import type` you ensure that the reference will be stripped at compile-time, meaning you don't inadvertently import server-side code into your client.
// For more information, see the Typescript docs: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export
// eslint-disable-next-line @nx/enforce-module-boundaries
import { useUserSession } from '@/api/users/user-provider';
import type { AppRouter } from '@/domain/utils';
import { getAuthHeaders } from '../supabase/get-auth-headers';

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

export const trpc = createTRPCReact<AppRouter>();

let queryClientSingleton: QueryClient;

export function getTrpcQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  return (queryClientSingleton ??= makeQueryClient());
}

function getUrl() {
  return `${
    process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080'
  }/trpc`;
}

export function TRPCProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = useUserSession();
  const headers = getAuthHeaders(session);

  // NOTE:
  // Avoid useState when initializing the query client if you don't
  // have a suspense boundary between this and the code that may
  // suspend because React will throw away the client on the initial
  // render if it suspends and there is no boundary
  const queryClient = getTrpcQueryClient();

  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [
          splitLink({
            condition(op) {
              // check for context property `skipBatch`
              return Boolean(op.context.skipBatch);
            },
            // when condition is true, use normal request
            true: httpLink({
              url: getUrl(),
              headers() {
                return headers;
              },
            }),
            // when condition is false, use batching
            false: httpBatchLink({
              // transformer: superjson, <-- if you use a data transformer
              url: getUrl(),
              headers() {
                return headers;
              },
            }),
          }),
        ],
      }),
    [headers]
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
