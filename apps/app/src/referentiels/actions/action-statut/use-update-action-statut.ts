import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { StatutAvancementIncludingNonConcerne } from '@tet/domain/referentiels';
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
          queryKey: trpc.referentiels.snapshots.getCurrent.queryKey({
            collectiviteId,
            referentielId,
          }),
        });
      },
    })
  );

  return {
    ...mutation,
    mutate: ({
      actionId,
      statut,
    }: {
      actionId: string;
      statut: StatutAvancementIncludingNonConcerne;
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
  };
};
