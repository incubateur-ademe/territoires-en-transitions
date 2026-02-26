import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

/**
 * Supprime une invitation en attente pour la collectivité courante.
 */
export const useRemoveInvitation = () => {
  const collectiviteId = useCollectiviteId();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const mutation = useMutation({
    ...trpc.collectivites.membres.invitations.deletePending.mutationOptions(),
    onSuccess: () => {
      if (collectiviteId) {
        queryClient.invalidateQueries({
          queryKey: trpc.collectivites.membres.list.queryKey({
            collectiviteId,
          }),
        });
        queryClient.invalidateQueries({
          queryKey:
            trpc.collectivites.membres.invitations.listPendings.queryKey({
              collectiviteId,
            }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.collectivites.tags.personnes.list.queryKey({
            collectiviteId,
          }),
        });
      }
    },
  });

  return {
    isLoading: mutation.isPending,
    removeInvitation: (email: string) => {
      if (!collectiviteId) return;
      mutation.mutate({ email, collectiviteId });
    },
  };
};
