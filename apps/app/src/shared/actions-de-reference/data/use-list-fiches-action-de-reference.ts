import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import type { UseListFichesActionDeReference } from '../actions-de-reference.contract';

export const useListFichesActionDeReference: UseListFichesActionDeReference = (
  actionDeReferenceId
) => {
  const trpc = useTRPC();
  const listFichesQuery = useQuery(
    trpc.shared.actionsDeReference.listFiches.queryOptions({
      id: actionDeReferenceId,
    })
  );

  if (listFichesQuery.data) {
    return { status: 'loaded', fiches: listFichesQuery.data };
  }
  if (listFichesQuery.isLoadingError) {
    return {
      status: 'error',
      retry: (): void => {
        void listFichesQuery.refetch();
      },
    };
  }
  return { status: 'loading' };
};
