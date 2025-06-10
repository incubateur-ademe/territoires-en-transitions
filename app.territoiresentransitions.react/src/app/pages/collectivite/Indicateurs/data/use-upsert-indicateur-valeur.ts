import { trpc } from '@/api/utils/trpc/client';

export const useUpsertIndicateurValeur = () => {
  const utils = trpc.useUtils();

  return trpc.indicateurs.valeurs.upsert.useMutation({
    onSuccess: (data, variables) => {
      const { collectiviteId, indicateurId } = variables;
      if (collectiviteId && indicateurId) {
        utils.indicateurs.valeurs.list.invalidate({
          collectiviteId,
          indicateurIds: [indicateurId],
        });
        utils.referentiels.actions.getValeursUtilisables.invalidate({
          collectiviteId,
        });
      }
    },
  });
};
