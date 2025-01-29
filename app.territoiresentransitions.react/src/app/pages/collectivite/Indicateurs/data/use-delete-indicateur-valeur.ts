import { trpc } from '@/api/utils/trpc/client';

export const useDeleteIndicateurValeur = () => {
  const utils = trpc.useUtils();

  return trpc.indicateurs.valeurs.delete.useMutation({
    onSuccess: (data, variables) => {
      const { collectiviteId, indicateurId } = variables;
      if (collectiviteId && indicateurId) {
        utils.indicateurs.valeurs.list.invalidate({
          collectiviteId,
          indicateurIds: [indicateurId],
        });
      }
    },
  });
};
