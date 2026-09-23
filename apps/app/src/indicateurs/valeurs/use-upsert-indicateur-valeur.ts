import { useToastContext } from '@/app/utils/toast/toast-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { broadcastQueryInvalidation } from '@tet/api/utils/react-query/cross-tab-invalidation';
import { ListIndicateurValeurOuput } from './use-list-indicateur-valeurs';

export type UpsertIndicateurValeurInput =
  RouterInput['indicateurs']['valeurs']['upsert'];

export const useUpsertIndicateurValeur = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setToast } = useToastContext();

  return useMutation(
    trpc.indicateurs.valeurs.upsert.mutationOptions({
      onSuccess: (_, variables) => {
        const { collectiviteId, indicateurId } = variables;
        if (!variables.id) {
          setToast('success', 'La valeur a été ajoutée');
        }

        // recharge les infos complémentaires associées à l'indicateur
        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.indicateurs.list.queryKey({
            collectiviteId,
          }),
        });

        queryClient
          .getQueriesData<ListIndicateurValeurOuput>({
            queryKey: trpc.indicateurs.valeurs.list.queryKey({
              collectiviteId,
            }),
          })
          .forEach(([queryKey, queryResult]) => {
            if (
              queryResult?.indicateurs.some(
                (indicateur) => indicateur.definition.id === indicateurId
              )
            ) {
              queryClient.invalidateQueries({ queryKey });
            }
          });

        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.actions.getValeursUtilisables.queryKey({
            collectiviteId,
          }),
        });

        // corriger une valeur déjà retenue pour le score d'une action
        // redéclenche son calcul côté backend (cf CrudValeursService /
        // SetScoreFromIndicateurService) : on ne sait pas ici quel(s)
        // référentiel(s)/action(s) sont concernés, donc on invalide largement
        // plutôt que de laisser un score obsolète affiché jusqu'au
        // rechargement de la page. `listActionsGroupedById` est inclus : le
        // score affiché sur l'action (barre de progression, points) vient de
        // son champ `score`, pas de `getScoreIndicatif` (cf
        // `SubactionIndicateurScore`).
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
      },
      onError: (_, variables) => {
        setToast(
          'error',
          `La valeur n'a pas pu être ${variables.id ? 'modifiée' : 'ajoutée'}`
        );
      },
    })
  );
};
