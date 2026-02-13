'use client';

import {
  QueryClientProvider,
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createTRPCClient, httpLink, TRPCClientErrorLike } from '@trpc/client';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { getQueryClient } from './react-query-client';

import type { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import { useState } from 'react';
import {
  getTrpcLoggerLink,
  getTrpcUrl,
  setCorrelationIdInContextAndGetHeader,
} from './trpc.utils';
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

const CLIENT_HTTP_LINK = httpLink({
  url: getTrpcUrl(),
  headers: (opts) => setCorrelationIdInContextAndGetHeader(opts),
  fetch: (url, options) => {
    return fetch(url, {
      ...options,
      credentials: 'include',
    });
  },
});

function getTrpcClient() {
  return createTRPCClient<AppRouter>({
    links: [getTrpcLoggerLink(), CLIENT_HTTP_LINK],
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
