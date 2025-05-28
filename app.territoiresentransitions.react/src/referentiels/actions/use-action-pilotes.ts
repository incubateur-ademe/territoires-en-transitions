import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';

/** Récupère la liste des pilotes d'une mesure */
export const useActionPilotesList = (actionId: string) => {
  const collectiviteId = useCollectiviteId();
  return trpc.referentiels.actions.listPilotes.useQuery({
    collectiviteId,
    actionId,
  });
};

/** Modifie la liste des pilotes d'une mesure */
export const useActionPilotesUpsert = () => {
  const utils = trpc.useUtils();
  return trpc.referentiels.actions.upsertPilotes.useMutation({
    onSuccess: (data, variables) => {
      utils.referentiels.actions.listPilotes.invalidate({
        collectiviteId: variables.collectiviteId,
        actionId: variables.actionId,
      });
      utils.referentiels.actions.listActions.invalidate({
        collectiviteId: variables.collectiviteId,
      });
    },
  });
};

/** Supprime les pilotes d'une mesure */
export const useActionPilotesDelete = () => {
  const utils = trpc.useUtils();
  return trpc.referentiels.actions.deletePilotes.useMutation({
    onSuccess: (data, variables) => {
      utils.referentiels.actions.listPilotes.invalidate({
        collectiviteId: variables.collectiviteId,
        actionId: variables.actionId,
      });
      utils.referentiels.actions.listActions.invalidate({
        collectiviteId: variables.collectiviteId,
      });
    },
  });
};
