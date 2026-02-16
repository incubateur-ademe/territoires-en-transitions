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
import { getAuthHeaders } from '../supabase/get-auth-headers';
import { getQueryClient } from './query-client';

import { SupabaseClient } from '@supabase/supabase-js';
import type { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import { getErrorMessage } from '@tet/domain/utils';
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

async function getHeadersFromSupabase(
  supabase: SupabaseClient,
  correlationId: string
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = getAuthHeaders(session);
  return {
    ...headers,
    'x-correlation-id': correlationId,
  };
}

function getTrpcClient(supabase: SupabaseClient) {
  return createTRPCClient<AppRouter>({
    links: [
      loggerLink({
        enabled: (op) => op.direction === 'down' && op.result instanceof Error,
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
      splitLink({
        condition(op) {
          // check for context property `batching`
          return Boolean(op.context.batching);
        },
        // when condition is true, use normal request
        false: httpLink({
          url: getUrl(),
          headers: (op) => {
            const correlationId = crypto.randomUUID();

            // attach to context so loggerLink can see it
            op.op.context = {
              ...(op.op.context ?? {}),
              correlationId,
            };
            return getHeadersFromSupabase(supabase, correlationId);
          },
        }),
        // when condition is false, use batching
        true: httpBatchLink({
          // transformer: superjson, <-- if you use a data transformer
          url: getUrl(),
          headers: (op) => {
            const correlationId = crypto.randomUUID();

            // attach to context so loggerLink can see it
            for (const opItem of op.opList) {
              opItem.context = {
                ...(opItem.context ?? {}),
                correlationId,
              };
            }
            return getHeadersFromSupabase(supabase, correlationId);
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
