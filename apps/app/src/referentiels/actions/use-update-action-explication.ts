import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import {
  getReferentielIdFromActionId,
  ListActionsDynamicStateResult,
} from '@tet/domain/referentiels';
import { patchActionExplicationInCache } from './patch-action-explication-in-cache';

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
          queryClient.getQueriesData<ListActionsDynamicStateResult>(
            listActionsFilter
          );

        queryClient.setQueriesData<ListActionsDynamicStateResult>(
          listActionsFilter,
          (old) => patchActionExplicationInCache(old, actionId, commentaire)
        );

        return { previousQueries, listActionsFilter };
      },
      onError: async (_err, _variables, context) => {
        context?.previousQueries?.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        // Le commentaire peut avoir été enregistré malgré l'erreur (échec
        // du recalcul du snapshot) : on se recale sur l'état serveur.
        if (context?.listActionsFilter) {
          await queryClient.invalidateQueries(context.listActionsFilter);
        }
      },
      // Pas de refetch de listActionsGroupedById : le commentaire n'a pas
      // d'effet sur les scores, et le patch couvre aussi les queries
      // inactives (page mesure démontée). On réaligne juste le cache sur la
      // valeur enregistrée.
      onSuccess: (data, { actionId }, context) => {
        if (!context?.listActionsFilter) return;
        queryClient.setQueriesData<ListActionsDynamicStateResult>(
          context.listActionsFilter,
          (old) => patchActionExplicationInCache(old, actionId, data.commentaire)
        );
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
