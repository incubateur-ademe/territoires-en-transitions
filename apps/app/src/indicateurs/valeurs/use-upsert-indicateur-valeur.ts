import { useCollectiviteId } from '@/api/collectivites';
import { RouterInput, useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type UpsertInput = RouterInput['indicateurs']['valeurs']['upsert'];

export const useUpsertIndicateurValeur = () => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  const mutationOptions = trpc.indicateurs.valeurs.upsert.mutationOptions();

  return useMutation({
    mutationKey: mutationOptions.mutationKey,

    mutationFn: async (input: Omit<UpsertInput, 'collectiviteId'>) => {
      return mutationOptions.mutationFn?.({
        collectiviteId,
        ...input,
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.indicateurs.valeurs.list.queryKey({ collectiviteId }),
      });
    },
  });
};
