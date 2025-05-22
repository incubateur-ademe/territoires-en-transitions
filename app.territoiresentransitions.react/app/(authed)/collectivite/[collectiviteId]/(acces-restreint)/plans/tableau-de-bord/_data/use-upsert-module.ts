import { trpc } from '@/api/utils/trpc/client';

/**
 * Ajoute ou modifie un module du tableau de bord d'une collectivité.
 */
export const useUpsertModule = () => {
  const utils = trpc.useUtils();

  return trpc.collectivites.tableauDeBord.upsert.useMutation({
    onSuccess: (data) => {
      utils.collectivites.tableauDeBord.list.invalidate({
        collectiviteId: data.collectiviteId,
      });

      utils.collectivites.tableauDeBord.get.invalidate({
        collectiviteId: data.collectiviteId,
        id: data.id,
      });
    },
  });
};
