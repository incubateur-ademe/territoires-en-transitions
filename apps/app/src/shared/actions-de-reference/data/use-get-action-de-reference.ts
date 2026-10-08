import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import type {
  ActionDeReference,
  ActionDeReferenceId,
} from '@tet/domain/shared';
import { TRPCClientError } from '@trpc/client';

export type ActionDeReferenceDetail =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly retry: () => void }
  | { readonly status: 'not-found' }
  | { readonly status: 'loaded'; readonly action: ActionDeReference };

const isNotFoundError = (error: unknown): boolean =>
  error instanceof TRPCClientError && error.data?.code === 'NOT_FOUND';

export const useGetActionDeReference = (
  actionDeReferenceId: ActionDeReferenceId
): ActionDeReferenceDetail => {
  const trpc = useTRPC();
  const getQuery = useQuery(
    trpc.shared.actionsDeReference.get.queryOptions({
      id: actionDeReferenceId,
    })
  );

  if (getQuery.isSuccess) {
    return { status: 'loaded', action: getQuery.data };
  }
  if (isNotFoundError(getQuery.error)) {
    return { status: 'not-found' };
  }
  if (getQuery.isLoadingError) {
    return {
      status: 'error',
      retry: (): void => {
        void getQuery.refetch();
      },
    };
  }
  return { status: 'loading' };
};
