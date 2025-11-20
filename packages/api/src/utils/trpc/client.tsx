'use client';

import { QueryClientProvider, UseQueryResult } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  createTRPCClient,
  httpBatchLink,
  httpLink,
  splitLink,
  TRPCClientErrorLike,
} from '@trpc/client';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { useMemo } from 'react';
import { useUserSession } from '../../users/user-context/user-provider';
import { getAuthHeaders } from '../supabase/get-auth-headers';
import { getQueryClient } from './query-client';

import type { AppRouter } from '@tet/backend/utils/trpc/trpc.router';

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

export type TRPCUseQueryResult<TData> = UseQueryResult<
  TData,
  TRPCClientErrorLike<AppRouter>
>;

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();

function getUrl() {
  return `${
    process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080'
  }/trpc`;
}

export function ReactQueryAndTRPCProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
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
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
