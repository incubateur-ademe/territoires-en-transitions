import { useTRPC } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useDeleteBudgets = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.plans.fiches.budgets.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.budgets.list.queryKey(),
        });
      },
    })
  );
};
