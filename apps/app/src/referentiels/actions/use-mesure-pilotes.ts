import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { PersonneTagOrUser } from '@tet/domain/collectivites';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { useListActions } from './use-list-actions';

export const useListMesurePilotes = (
  actionId: string
): { data: PersonneTagOrUser[]; isLoading: boolean } => {
  const { data, isPending } = useListActions({ actionIds: [actionId] });
  return {
    data: data[0]?.pilotes ?? [],
    isLoading: isPending,
  };
};

/** Modifie la liste des pilotes d'une mesure */
export const useUpsertMesurePilotes = () => {
  const trpc = useTRPC();

  const queryClient = useQueryClient();
  return useMutation(
    trpc.referentiels.actions.upsertPilotes.mutationOptions({
      onSuccess: (_, variables) => {
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

/** Supprime les pilotes d'une mesure */
export const useDeleteMesurePilotes = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.referentiels.actions.deletePilotes.mutationOptions({
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
