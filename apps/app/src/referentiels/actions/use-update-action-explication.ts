import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import {
  ActionId,
  ActionsGroupedById,
  getReferentielIdFromActionId,
} from '@tet/domain/referentiels';

function patchActionExplicationInCache(
  old: ActionsGroupedById | undefined,
  actionId: ActionId,
  commentaire: string
): ActionsGroupedById | undefined {
  if (!old) return old;
  const action = old[actionId];
  if (!action) return old;
  return {
    ...old,
    [actionId]: {
      ...action,
      score: {
        ...action.score,
        explication: commentaire,
      },
    },
  };
}

export const useUpdateActionExplication = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.referentiels.actions.updateCommentaire.mutationOptions({
      onMutate: async ({ actionId, collectiviteId, commentaire }) => {
        const listActionsFilter =
          trpc.referentiels.actions.listActionsGroupedById.queryFilter({
            collectiviteId,
            referentielId: getReferentielIdFromActionId(actionId),
          });

        await queryClient.cancelQueries(listActionsFilter);

        const previousQueries =
          queryClient.getQueriesData<ActionsGroupedById>(listActionsFilter);

        queryClient.setQueriesData<ActionsGroupedById>(
          listActionsFilter,
          (old) => patchActionExplicationInCache(old, actionId, commentaire)
        );

        return { previousQueries };
      },
      onError: (_err, _variables, context) => {
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      },
      onSuccess: async (_data, { actionId, collectiviteId }) => {
        // refetchType 'all' : la page mesure peut être démontée (navigation
        // « mesure suivante ») ; avec DISABLE_AUTO_REFETCH, sans ça le cache
        // reste stale au retour sur la mesure.
        await queryClient.invalidateQueries({
          ...trpc.referentiels.actions.listActionsGroupedById.queryFilter({
            collectiviteId,
            referentielId: getReferentielIdFromActionId(actionId),
          }),
          refetchType: 'all',
        });
      },
      // On rafraîchit l'historique dans `onSettled` plutôt que `onSuccess`
      // pour rester cohérent avec le pattern de
      // `useSetPersonnalisationJustification` : le cache historique doit
      // être invalidé même en cas d'échec (pour rebondir sur l'état serveur
      // après un rollback optimistique), et la promesse de mutation ne se
      // résout qu'une fois les invalidations propagées.
      onSettled: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.referentiels.historique.list.queryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.referentiels.historique.listUtilisateurs.queryKey(),
        });
      },
    })
  );
};
