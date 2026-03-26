import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { StatutAvancementCreate } from '@tet/domain/referentiels';
import { useCallback } from 'react';
import { useReferentielId } from '../../referentiel-context';
import { statutParAvancement } from '../../utils';

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
      },
    })
  );

  const mutate = useCallback(
    ({
      actionId,
      statut,
    }: {
      actionId: string;
      statut: StatutAvancementCreate;
    }) => {
      const { avancement, concerne, avancementDetaille } =
        statutParAvancement(statut);

      return mutation.mutate({
        collectiviteId,
        actionId,
        avancement,
        concerne,
        avancementDetaille,
      });
    },
    [collectiviteId, mutation]
  );

  return {
    ...mutation,
    mutate,
  };
};
