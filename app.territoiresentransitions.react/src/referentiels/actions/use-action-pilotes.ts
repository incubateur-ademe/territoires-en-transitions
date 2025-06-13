import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';
import { PersonneTagOrUser } from '@/backend/collectivites/index-domain';

export const useMesurePilotesList = (actionId: string) => {
  const collectiviteId = useCollectiviteId();

  const { data: pilotesData } = trpc.referentiels.actions.listPilotes.useQuery({
    collectiviteId,
    actionIds: [actionId],
  }) as { data: Record<string, PersonneTagOrUser[]> | undefined }; // boooof

  return {
    data: pilotesData?.[actionId] || [],
  };
};

/** Modifie la liste des pilotes d'une mesure */
export const useMesurePilotesUpsert = () => {
  const utils = trpc.useUtils();
  return trpc.referentiels.actions.upsertPilotes.useMutation({
    onSuccess: (data, variables) => {
      utils.referentiels.actions.listPilotes.invalidate({
        collectiviteId: variables.collectiviteId,
        actionIds: [variables.actionId],
      });
      utils.referentiels.actions.listActions.invalidate({
        collectiviteId: variables.collectiviteId,
      });
    },
  });
};

/** Supprime les pilotes d'une mesure */
export const useMesurePilotesDelete = () => {
  const utils = trpc.useUtils();
  return trpc.referentiels.actions.deletePilotes.useMutation({
    onSuccess: (data, variables) => {
      utils.referentiels.actions.listPilotes.invalidate({
        collectiviteId: variables.collectiviteId,
        actionIds: [variables.actionId],
      });
      utils.referentiels.actions.listActions.invalidate({
        collectiviteId: variables.collectiviteId,
      });
    },
  });
};
