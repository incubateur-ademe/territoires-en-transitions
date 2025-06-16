import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';

/** Récupère la liste des services pilotes d'une mesure */
export const useListMesureServicesPilotes = (actionId: string) => {
  const collectiviteId = useCollectiviteId();

  const { data: servicesData } =
    trpc.referentiels.actions.listServices.useQuery({
      collectiviteId,
      mesureIds: [actionId],
    });

  return {
    data: servicesData?.[actionId] || [],
  };
};

/** Modifie la liste des services pilotes d'une mesure */
export const useUpsertMesureServicesPilotes = () => {
  const utils = trpc.useUtils();
  return trpc.referentiels.actions.upsertServices.useMutation({
    onSuccess: (data, variables) => {
      utils.referentiels.actions.listServices.invalidate({
        collectiviteId: variables.collectiviteId,
        mesureIds: [variables.mesureId],
      });
      utils.referentiels.actions.listActions.invalidate({
        collectiviteId: variables.collectiviteId,
      });
    },
  });
};

/** Supprime les services pilotes d'une mesure */
export const useDeleteMesureServicesPilotes = () => {
  const utils = trpc.useUtils();
  return trpc.referentiels.actions.deleteServices.useMutation({
    onSuccess: (data, variables) => {
      utils.referentiels.actions.listServices.invalidate({
        collectiviteId: variables.collectiviteId,
        mesureIds: [variables.mesureId],
      });
      utils.referentiels.actions.listActions.invalidate({
        collectiviteId: variables.collectiviteId,
      });
    },
  });
};
