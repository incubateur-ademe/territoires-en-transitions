import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

export const useUpsertBudgets = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const collectiviteId = useCollectiviteId();
  return useMutation(
    trpc.plans.fiches.budgets.upsert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.budgets.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.listFiches.queryKey({
            collectiviteId: collectiviteId,
          }),
        });
      },
    })
  );
};
