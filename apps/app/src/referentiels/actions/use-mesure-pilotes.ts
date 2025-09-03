import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useNPSSurveyManager } from '@/ui/components/tracking/use-nps-survey-manager';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
  const { trackUpdateOperation } = useNPSSurveyManager();
  return useMutation(
    trpc.referentiels.actions.upsertPilotes.mutationOptions({
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.actions.listPilotes.queryKey({
            collectiviteId: variables.collectiviteId,
            mesureIds: [variables.mesureId],
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.actions.listActions.queryKey({
            collectiviteId: variables.collectiviteId,
          }),
        });
        trackUpdateOperation('referentiels');
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
          queryKey: trpc.referentiels.actions.listActions.queryKey({
            collectiviteId: variables.collectiviteId,
          }),
        });
      },
    })
  );
};
