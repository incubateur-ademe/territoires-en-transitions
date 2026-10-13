import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import type { UseListFichesActionDeReference } from '../actions-de-reference.contract';
import { toActionDeReferenceFiches } from './to-action-de-reference-fiches';

export const useListFichesActionDeReference: UseListFichesActionDeReference = (
  actionDeReferenceId
) => {
  const trpc = useTRPC();
  const listFichesQuery = useQuery(
    trpc.shared.actionsDeReference.listFiches.queryOptions({
      id: actionDeReferenceId,
    })
  );

  return toActionDeReferenceFiches(listFichesQuery);
};
