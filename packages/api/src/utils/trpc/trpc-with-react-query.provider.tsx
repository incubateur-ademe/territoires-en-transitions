'use client';

import {
  QueryClientProvider,
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  createTRPCClient,
  httpBatchLink,
  httpLink,
  loggerLink,
  splitLink,
  TRPCClientErrorLike,
} from '@trpc/client';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { getQueryClient } from './react-query-client';

import type { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import { useState } from 'react';
import { ENV } from '../../environmentVariables';
import { getTrpcUrl } from './get-trpc-url.utils';
export type { AppRouter };

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

type TRPCContext = ReturnType<typeof createTRPCContext<AppRouter>>;

const trpcContext = createTRPCContext<AppRouter>();

export const TRPCProvider: TRPCContext['TRPCProvider'] =
  trpcContext.TRPCProvider;
export const useTRPC: TRPCContext['useTRPC'] = trpcContext.useTRPC;
export const useTRPCClient: TRPCContext['useTRPCClient'] =
  trpcContext.useTRPCClient;

export type TRPCUseQueryResult<TData> = UseQueryResult<
  TData,
  TRPCClientErrorLike<AppRouter>
>;

export type TRPCUseMutationResult<TVariables, TData> = UseMutationResult<
  TData,
  TRPCClientErrorLike<AppRouter>,
  TVariables,
  unknown
>;

function getTrpcClient() {
  return createTRPCClient<AppRouter>({
    links: [
      loggerLink({
        enabled: (op) =>
          ENV.node_env === 'development' ||
          (op.direction === 'down' && op.result instanceof Error),
      }),
      splitLink({
        condition(op) {
          // check for context property `batching`
          return Boolean(op.context.batching);
        },
        // when condition is true, use normal request
        true: httpLink({
          url: getTrpcUrl(),
          fetch: (url, options) => {
            return fetch(url, {
              ...options,
              credentials: 'include',
            });
          },
        }),
        // when condition is false, use batching
        true: httpBatchLink({
          // transformer: superjson, <-- if you use a data transformer
          url: getTrpcUrl(),
          fetch: (url, options) => {
            return fetch(url, {
              ...options,
              credentials: 'include',
            });
          },
        }),
      }),
    ],
  });
}

export function TrpcWithReactQueryProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [trpcClient] = useState(() => getTrpcClient());

  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
