import { trpc } from '@/api/utils/trpc/client';
import { TIndicateurDefinition } from '../types';
import { useInvalidateValeurs } from './use-invalidate-valeurs';

export const useDeleteIndicateurValeur = (
  definition: TIndicateurDefinition
) => {
  const utils = trpc.useUtils();
  const invalidate = useInvalidateValeurs(definition);

  return trpc.indicateurs.valeurs.delete.useMutation({
    onSuccess: (data, variables) => {
      const { collectiviteId, indicateurId } = variables;
      if (collectiviteId && indicateurId) {
        utils.indicateurs.valeurs.list.invalidate({
          collectiviteId,
          indicateurIds: [indicateurId],
        });

        // TODO: à supprimer quand tous les composants utiliseront
        // seulement l'appel trpc pour lire les données
        invalidate({ collectiviteId, indicateurId });
      }
    },
  });
};
