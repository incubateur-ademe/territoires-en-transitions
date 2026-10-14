import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterInput, useTRPC, useTRPCClient } from '@tet/api';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { getActionStatesCollection } from './db/action-states.collection';
import { updateActionExplicationOptimistically } from './db/update-action-explication.action';

type UpdateCommentaireInput =
  RouterInput['referentiels']['actions']['updateCommentaire'];

export const useUpdateActionExplication = () => {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: trpc.referentiels.actions.updateCommentaire.mutationKey(),
    // Mise à jour optimiste dans la collection de l'état des actions, annulée
    // automatiquement si l'enregistrement échoue. `useMutation` est conservé
    // pour les toasts et l'état `isPending` des appelants.
    mutationFn: async (input: UpdateCommentaireInput) => {
      const states = getActionStatesCollection(
        { queryClient, trpc, trpcClient },
        {
          collectiviteId: input.collectiviteId,
          referentielId: getReferentielIdFromActionId(input.actionId),
        }
      );
      await updateActionExplicationOptimistically(states, input, (vars) =>
        trpcClient.referentiels.actions.updateCommentaire.mutate(vars)
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
  });
};
