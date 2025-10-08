import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { CollectiviteMembre } from '@/app/referentiels/tableau-de-bord/referents/useMembres';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Retire un membre de la collectivité courante
 */
export const useRemoveFromCollectivite = () => {
  const collectiviteId = useCollectiviteId();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { mutateAsync: removeMember } = useMutation(
    trpc.collectivites.membres.remove.mutationOptions()
  );

  const { isPending, mutate } = useMutation({
    mutationFn: async (membre: CollectiviteMembre) => {
      if (!collectiviteId || !membre.email) return null;

      return await removeMember({
        email: membre.email,
        collectiviteId,
      });
    },

    onSuccess: () => {
      // recharge la liste après avoir retiré l'utilisateur de la collectivité
      queryClient.invalidateQueries({
        queryKey: trpc.collectivites.membres.list.queryKey({ collectiviteId }),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.collectivites.tags.personnes.list.queryKey({
          collectiviteId,
        }),
      });
    },
  });

  return {
    isLoading: isPending,
    removeFromCollectivite: mutate,
  };
};
