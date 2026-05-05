import {
  DistributiveOmit,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useCallback } from 'react';
import { useReferentielId } from '../../referentiel-context';

type ActionStatutCreate =
  RouterInput['referentiels']['actions']['updateStatut'];

export const useUpdateActionStatut = () => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const mutation = useMutation(
    trpc.referentiels.actions.updateStatut.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.actions.listActionsGroupedById.queryKey({
            collectiviteId,
            referentielId,
          }),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.snapshots.getCurrent.queryKey({
            collectiviteId,
            referentielId,
          }),
        });
      },
    })
  );

  const mutate = useCallback(
    (actionStatut: DistributiveOmit<ActionStatutCreate, 'collectiviteId'>) => {
      return mutation.mutate({
        ...actionStatut,
        collectiviteId,
      });
    },
    [collectiviteId, mutation]
  );

  return {
    ...mutation,
    mutate,
  };
};
