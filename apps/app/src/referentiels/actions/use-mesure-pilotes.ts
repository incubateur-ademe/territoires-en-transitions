import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';

export const useListMesurePilotes = (actionId: string) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  const { data: pilotesData } = useQuery(
    trpc.referentiels.actions.listPilotes.queryOptions({
      collectiviteId,
      mesureIds: [actionId],
    })
  );

  return {
    data: pilotesData?.[actionId] || [],
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
          queryKey: trpc.referentiels.actions.listPilotes.queryKey({
            collectiviteId: variables.collectiviteId,
            mesureIds: [variables.mesureId],
          }),
        });

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
          queryKey: trpc.referentiels.actions.listPilotes.queryKey({
            collectiviteId: variables.collectiviteId,
            mesureIds: [variables.mesureId],
          }),
        });
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
