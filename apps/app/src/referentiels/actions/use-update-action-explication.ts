import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import {
  ActionsGroupedById,
  getReferentielIdFromActionId,
} from '@tet/domain/referentiels';

export const useUpdateActionExplication = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.referentiels.actions.updateCommentaire.mutationOptions({
      onMutate: async (variables) => {
        const queryKey =
          trpc.referentiels.actions.listActionsGroupedById.queryKey({
            collectiviteId: variables.collectiviteId,
            referentielId: getReferentielIdFromActionId(variables.actionId),
          });

        await queryClient.cancelQueries({ queryKey });

        const previous = queryClient.getQueryData<ActionsGroupedById>(queryKey);

        queryClient.setQueryData<ActionsGroupedById>(queryKey, (old) => {
          if (!old) return old;
          const action = old[variables.actionId];
          if (!action) return old;
          return {
            ...old,
            [variables.actionId]: {
              ...action,
              score: {
                ...action.score,
                explication: variables.commentaire,
              },
            },
          };
        });

        return { previous };
      },
      onError: (_err, variables, context) => {
        const queryKey =
          trpc.referentiels.actions.listActionsGroupedById.queryKey({
            collectiviteId: variables.collectiviteId,
            referentielId: getReferentielIdFromActionId(variables.actionId),
          });

        if (context?.previous !== undefined) {
          queryClient.setQueryData(queryKey, context.previous);
        }
      },
      onSuccess: (variables) => {
        queryClient.invalidateQueries({
          queryKey: ['historique', variables.collectiviteId],
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
