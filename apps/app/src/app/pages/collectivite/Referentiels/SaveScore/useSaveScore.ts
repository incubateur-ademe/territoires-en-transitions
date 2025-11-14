import { useTRPC } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useSaveSnapshot = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.referentiels.snapshots.computeAndUpsert.mutationOptions({
      onSuccess: (_, { collectiviteId, referentielId }) => {
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.snapshots.list.queryKey({
            collectiviteId,
            referentielId,
          }),
        });
      },
      meta: {
        success: 'État des lieux figé avec succès',
        error:
          "Une sauvegarde de l'état des lieux à cette date et/ou avec ce nom existe déjà.",
      },
    })
  );
};
