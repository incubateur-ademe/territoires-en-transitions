'use client';

import {
  QueryClientProvider,
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  createTRPCClient,
  httpLink,
  TRPCClient,
  TRPCClientErrorLike,
} from '@trpc/client';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getQueryClient } from './react-query-client';

import type { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import { useEffect, useState } from 'react';
import { listenForCrossTabQueryInvalidation } from '../react-query/cross-tab-invalidation';
import { useSupabase } from '../supabase/use-supabase';
import {
  getBrowserTrpcUrl,
  getTrpcLoggerLink,
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

/**
 * Le jeton de session part en `Authorization: Bearer`, pas par le cookie : le
 * backend n'a ainsi pas besoin que le cookie de session soit visible sur son
 * domaine (cookie limité à l'hôte de l'app). Sans client Supabase (site), les
 * appels sont anonymes.
 */
export function getTrpcClient(
  supabase?: SupabaseClient
): TRPCClient<AppRouter> {
  return createTRPCClient<AppRouter>({
    links: [
      getTrpcLoggerLink(),
      httpLink({
        url: getBrowserTrpcUrl(),
        headers: async (opts) => {
          const accessToken = (await supabase?.auth.getSession())?.data.session
            ?.access_token;
          return {
            ...setCorrelationIdInContextAndGetHeader(opts),
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          };
        },
      }),
    ],
  });
}

export function TrpcWithReactQueryProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = useSupabase();
  const [trpcClient] = useState(() => getTrpcClient(supabase));

  const queryClient = getQueryClient();

  useEffect(
    () => listenForCrossTabQueryInvalidation(queryClient),
    [queryClient]
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
