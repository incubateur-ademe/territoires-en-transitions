import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';

/** Modifie la liste des services pilotes d'une mesure */
export const useUpsertMesureServicesPilotes = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.referentiels.actions.upsertServices.mutationOptions({
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.actions.listActionsGroupedById.queryKey({
            collectiviteId: variables.collectiviteId,
            referentielId: getReferentielIdFromActionId(variables.mesureId),
          }),
        });
      },
    })
  );
};

/** Supprime les services pilotes d'une mesure */
export const useDeleteMesureServicesPilotes = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.referentiels.actions.deleteServices.mutationOptions({
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.actions.listActionsGroupedById.queryKey({
            collectiviteId: variables.collectiviteId,
            referentielId: getReferentielIdFromActionId(variables.mesureId),
          }),
        });
      },
    })
  );
};
