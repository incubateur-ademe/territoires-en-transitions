import { useCollectiviteId } from '@/api/collectivites';
import { trpc, useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

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
  const utils = trpc.useUtils();
  return trpc.referentiels.actions.upsertPilotes.useMutation({
    onSuccess: (data, variables) => {
      utils.referentiels.actions.listPilotes.invalidate({
        collectiviteId: variables.collectiviteId,
        mesureIds: [variables.mesureId],
      });
      utils.referentiels.actions.listActions.invalidate({
        collectiviteId: variables.collectiviteId,
      });
    },
  });
};

/** Supprime les pilotes d'une mesure */
export const useDeleteMesurePilotes = () => {
  const utils = trpc.useUtils();
  return trpc.referentiels.actions.deletePilotes.useMutation({
    onSuccess: (data, variables) => {
      utils.referentiels.actions.listPilotes.invalidate({
        collectiviteId: variables.collectiviteId,
        mesureIds: [variables.mesureId],
      });
      utils.referentiels.actions.listActions.invalidate({
        collectiviteId: variables.collectiviteId,
      });
    },
  });
};
