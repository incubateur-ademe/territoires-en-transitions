'use client';

import {
  QueryClientProvider,
  useMutation,
  UseMutationResult,
  useQuery,
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

export type TRPCUseMutationResult<TData> = UseMutationResult<
  TData,
  TRPCClientErrorLike<AppRouter>
>;

/**
 * Helper type pour extraire le type de retour d'une mutation tRPC depuis RouterOutput.
 * Utilisez ce type pour annoter explicitement le type de retour de vos hooks
 * qui utilisent useMutation avec mutationOptions, évitant ainsi l'erreur TS2742.
 *
 * @example
 * ```typescript
 * export const useDeleteModule = (): TRPCMutationResult<
 *   RouterOutput['collectivites']['tableauDeBord']['delete']
 * > => {
 *   const trpc = useTRPC();
 *   return useMutation(trpc.collectivites.tableauDeBord.delete.mutationOptions());
 * };
 * ```
 */
export type TRPCMutationResult<TData = void> = UseMutationResult<
  TData,
  TRPCClientErrorLike<AppRouter>,
  unknown,
  unknown
>;

/**
 * Helper type pour extraire le type de retour d'une mutationOptions tRPC.
 * Version alternative qui extrait le type depuis la fonction mutationOptions elle-même.
 *
 * @example
 * ```typescript
 * export const useDeleteModule = (): TRPCMutationResultFromOptions<
 *   typeof trpc.collectivites.tableauDeBord.delete.mutationOptions
 * > => {
 *   const trpc = useTRPC();
 *   return useMutation(trpc.collectivites.tableauDeBord.delete.mutationOptions());
 * };
 * ```
 */
export type TRPCMutationResultFromOptions<
  TMutationOptions extends (...args: any[]) => any
> = UseMutationResult<
  Awaited<ReturnType<ReturnType<TMutationOptions>['mutationFn']>>,
  TRPCClientErrorLike<AppRouter>,
  Parameters<ReturnType<TMutationOptions>['mutationFn']>[0],
  unknown
>;

/**
 * Helper type pour extraire le type de retour d'une queryOptions tRPC.
 * Utilisez ce type pour annoter explicitement le type de retour de vos hooks
 * qui utilisent useQuery avec queryOptions.
 *
 * @example
 * ```typescript
 * export const useGetData = (): TRPCQueryResult<
 *   typeof trpc.collectivites.get.queryOptions
 * > => {
 *   const trpc = useTRPC();
 *   return useQuery(trpc.collectivites.get.queryOptions({ id: 1 }));
 * };
 * ```
 */
export type TRPCQueryResult<TQueryOptions extends (...args: any[]) => any> =
  UseQueryResult<
    Awaited<ReturnType<ReturnType<TQueryOptions>['queryFn']>>,
    TRPCClientErrorLike<AppRouter>
  >;

type TRPCContext = ReturnType<typeof createTRPCContext<AppRouter>>;

const trpcContext = createTRPCContext<AppRouter>();

export const TRPCProvider: TRPCContext['TRPCProvider'] =
  trpcContext.TRPCProvider;
export const useTRPC: TRPCContext['useTRPC'] = trpcContext.useTRPC;
export const useTRPCClient: TRPCContext['useTRPCClient'] =
  trpcContext.useTRPCClient;

/**
 * Wrapper autour de useMutation qui préserve l'inférence de type automatique
 * tout en évitant l'erreur TS2742 liée aux types internes de @trpc/server.
 *
 * Utilisez ce hook au lieu de useMutation directement pour bénéficier de
 * l'inférence automatique des types depuis les endpoints tRPC.
 *
 * Le wrapper utilise une surcharge de fonction qui permet à TypeScript d'inférer
 * le type de retour sans avoir besoin de le nommer explicitement, évitant ainsi TS2742.
 *
 * @example
 * ```typescript
 * export const useDeleteModule = () => {
 *   const trpc = useTRPC();
 *   return useTRPCMutation(
 *     trpc.collectivites.tableauDeBord.delete.mutationOptions()
 *   );
 * };
 * ```
 */
export function useTRPCMutation<TMutationOptions>(
  options: TMutationOptions
): ReturnType<typeof useMutation> {
  return useMutation(options as Parameters<typeof useMutation>[0]);
}

/**
 * Wrapper autour de useQuery qui préserve l'inférence de type automatique
 * tout en évitant l'erreur TS2742 liée aux types internes de @trpc/server.
 *
 * Utilisez ce hook au lieu de useQuery directement pour bénéficier de
 * l'inférence automatique des types depuis les endpoints tRPC.
 *
 * @example
 * ```typescript
 * export const useGetData = () => {
 *   const trpc = useTRPC();
 *   return useTRPCQuery(
 *     trpc.collectivites.get.queryOptions({ id: 1 })
 *   );
 * };
 * ```
 */
export function useTRPCQuery<
  TQueryOptions extends Parameters<typeof useQuery>[0]
>(options: TQueryOptions) {
  const result = useQuery(options);
  return result as typeof result;
}

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
