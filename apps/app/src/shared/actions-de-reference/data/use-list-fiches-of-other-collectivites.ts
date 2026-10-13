import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import type { UseListFichesActionDeReference } from '../actions-de-reference.contract';
import { toActionDeReferenceFiches } from './to-action-de-reference-fiches';

export const useListFichesOfOtherCollectivites: UseListFichesActionDeReference =
  (actionDeReferenceId) => {
    const trpc = useTRPC();
    const currentCollectiviteId = useCollectiviteId();
    const listFichesQuery = useQuery(
      trpc.shared.actionsDeReference.listFiches.queryOptions({
        id: actionDeReferenceId,
        excludedCollectiviteId: currentCollectiviteId,
      })
    );

    return toActionDeReferenceFiches(listFichesQuery);
  };
