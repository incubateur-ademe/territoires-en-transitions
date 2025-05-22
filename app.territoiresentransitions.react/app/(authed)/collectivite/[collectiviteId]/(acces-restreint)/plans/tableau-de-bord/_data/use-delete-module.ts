import { trpc } from '@/api/utils/trpc/client';

/**
 * Supprime un module du tableau de bord d'une collectivité.
 */
export const useDeleteModule = () => {
  const utils = trpc.useUtils();

  return trpc.collectivites.tableauDeBord.delete.useMutation({
    onSuccess: (data, variables) => {
      utils.collectivites.tableauDeBord.list.invalidate({
        collectiviteId: variables.collectiviteId,
      });
    },
  });
};
