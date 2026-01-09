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
  splitLink,
  TRPCClientErrorLike,
} from '@trpc/client';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { getAuthHeaders } from '../supabase/get-auth-headers';
import { getQueryClient } from './query-client';

import { SupabaseClient } from '@supabase/supabase-js';
import type { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import { useState } from 'react';
import { useSupabase } from '../supabase/use-supabase';
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

function getUrl() {
  return `${
    process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080'
  }/trpc`;
}

async function getHeadersFromSupabase(supabase: SupabaseClient) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return getAuthHeaders(session);
}

function getTrpcClient(supabase: SupabaseClient) {
  return createTRPCClient<AppRouter>({
    links: [
      splitLink({
        condition(op) {
          // check for context property `batching`
          return Boolean(op.context.batching);
        },
        // when condition is true, use normal request
        false: httpLink({
          url: getUrl(),
          headers: () => getHeadersFromSupabase(supabase),
        }),
        // when condition is false, use batching
        true: httpBatchLink({
          // transformer: superjson, <-- if you use a data transformer
          url: getUrl(),
          headers: () => getHeadersFromSupabase(supabase),
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
  const supabase = useSupabase();
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() => getTrpcClient(supabase));

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
