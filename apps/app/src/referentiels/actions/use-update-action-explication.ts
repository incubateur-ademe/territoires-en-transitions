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
    })
  );
};
