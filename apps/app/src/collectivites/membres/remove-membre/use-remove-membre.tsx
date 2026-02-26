import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

/**
 * Retire un membre de la collectivité courante.
 */
export const useRemoveMembre = () => {
  const collectiviteId = useCollectiviteId();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const mutation = useMutation(
    trpc.collectivites.membres.remove.mutationOptions({
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
    })
  );

  return {
    ...mutation,
    mutateAsync: ({ userId }: { userId: string }) => {
      return mutation.mutateAsync({ collectiviteId, userId });
    },
  };
};
