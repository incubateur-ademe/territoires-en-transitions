import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { broadcastQueryInvalidation } from '@tet/api/utils/react-query/cross-tab-invalidation';

export const useDeleteIndicateurValeur = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.indicateurs.valeurs.delete.mutationOptions({
      onSuccess: (_, variables) => {
        const { collectiviteId, indicateurId } = variables;
        if (collectiviteId && indicateurId) {
          // recharge les infos complémentaires associées à l'indicateur
          queryClient.invalidateQueries({
            queryKey: trpc.indicateurs.indicateurs.list.queryKey({
              collectiviteId,
            }),
          });
          queryClient.invalidateQueries({
            queryKey: trpc.indicateurs.valeurs.list.queryKey({
              collectiviteId,
              indicateurIds: [indicateurId],
            }),
          });

          // supprimer une valeur retenue pour le score d'une action
          // redéclenche son calcul côté backend (cf CrudValeursService /
          // SetScoreFromIndicateurService) : on ne sait pas ici quel(s)
          // référentiel(s)/action(s) sont concernés, donc on invalide
          // largement plutôt que de laisser un score obsolète affiché
          // jusqu'au rechargement de la page. `listActionsGroupedById` est
          // inclus : le score affiché sur l'action (barre de progression,
          // points) vient de son champ `score`, pas de `getScoreIndicatif`
          // (cf `SubactionIndicateurScore`).
          const scoreQueryKeys = [
            trpc.referentiels.snapshots.getCurrent.queryKey(),
            trpc.referentiels.actions.listActionsGroupedById.queryKey(),
            trpc.referentiels.actions.getScoreIndicatif.queryKey(),
            trpc.referentiels.actions.getValeursUtilisables.queryKey(),
          ];
          scoreQueryKeys.forEach((queryKey) => {
            queryClient.invalidateQueries({ queryKey });
          });
          broadcastQueryInvalidation(scoreQueryKeys);
        }
      },
      meta: {
        success: 'La valeur a été supprimée',
        error: "La valeur n'a pas pu être supprimée",
      },
    })
  );
};
