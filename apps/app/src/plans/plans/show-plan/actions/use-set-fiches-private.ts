import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

export const useSetFichesPrivate = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const collectiviteId = useCollectiviteId();

  return useMutation(
    trpc.plans.plans.setFichesPrivate.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.listFiches.queryKey({ collectiviteId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.get.pathKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.plans.plans.get.pathKey(),
        });
      },
    })
  );
};
