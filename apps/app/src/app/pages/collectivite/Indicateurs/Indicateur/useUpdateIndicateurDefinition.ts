import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdateIndicateurDefinition = () => {
  const collectiviteId = useCollectiviteId();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.indicateurs.definitions.updateIndicateur.mutationOptions({
      onSuccess: (data, variables) => {
        const { indicateurId } = variables;
        if (collectiviteId && indicateurId) {
          // recharge les infos complémentaires associées à l'indicateur
          queryClient.invalidateQueries({
            queryKey: trpc.indicateurs.definitions.list.queryKey({
              collectiviteId,
            }),
          });
        }
      },
    })
  );
};
