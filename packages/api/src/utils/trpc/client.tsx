'use client';

import { useUserSession } from '@/api/users/user-provider';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  createTRPCClient,
  httpBatchLink,
  httpLink,
  splitLink,
} from '@trpc/client';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { useMemo } from 'react';
import { getAuthHeaders } from '../supabase/get-auth-headers';
import { getQueryClient } from './query-client';

// By using `import type` you ensure that the reference will be stripped at compile-time, meaning you don't inadvertently import server-side code into your client.
// For more information, see the Typescript docs: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { AppRouter } from '@/domain/trpc-router';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();

function getUrl() {
  return `${
    process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080'
  }/trpc`;
}

export function ReactQueryAndTRPCProvider({
  children,
  allowUnauthenticatedRequests = false,
}: Readonly<{
  children: React.ReactNode;
  allowUnauthenticatedRequests?: boolean;
}>) {
  const session = useUserSession();
  const headers = getAuthHeaders(session);

  const queryClient = getQueryClient();

  const trpcClient = useMemo(
    () =>
      createTRPCClient<AppRouter>({
        links: [
          splitLink({
            condition(op) {
              // check for context property `batching`
              return Boolean(op.context.batching);
            },
            // when condition is true, use normal request
            false: httpLink({
              url: getUrl(),
              headers() {
                return headers;
              },
            }),
            // when condition is false, use batching
            true: httpBatchLink({
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
    <QueryClientProvider client={queryClient}>
      {(session || allowUnauthenticatedRequests) && (
        // When unauthenticated requests are not allowed,
        // we prevent them from being executed in early rendered components
        // by waiting for `session` to be defined
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          {children}
        </TRPCProvider>
      )}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
