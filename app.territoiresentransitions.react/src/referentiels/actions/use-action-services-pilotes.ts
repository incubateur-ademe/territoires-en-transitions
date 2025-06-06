import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';

/** Récupère la liste des services pilotes d'une mesure */
export const useActionServicesPilotesList = (actionId: string) => {
  const collectiviteId = useCollectiviteId();
  return trpc.referentiels.actions.listServices.useQuery({
    collectiviteId,
    actionId,
  });
};

/** Modifie la liste des services pilotes d'une mesure */
export const useActionServicesPilotesUpsert = () => {
  const utils = trpc.useUtils();
  return trpc.referentiels.actions.upsertServices.useMutation({
    onSuccess: (data, variables) => {
      utils.referentiels.actions.listServices.invalidate({
        collectiviteId: variables.collectiviteId,
        actionId: variables.actionId,
      });
      utils.referentiels.actions.listActions.invalidate({
        collectiviteId: variables.collectiviteId,
      });
    },
  });
};

/** Supprime les services pilotes d'une mesure */
export const useActionServicesPilotesDelete = () => {
  const utils = trpc.useUtils();
  return trpc.referentiels.actions.deleteServices.useMutation({
    onSuccess: (data, variables) => {
      utils.referentiels.actions.listServices.invalidate({
        collectiviteId: variables.collectiviteId,
        actionId: variables.actionId,
      });
      utils.referentiels.actions.listActions.invalidate({
        collectiviteId: variables.collectiviteId,
      });
    },
  });
};
