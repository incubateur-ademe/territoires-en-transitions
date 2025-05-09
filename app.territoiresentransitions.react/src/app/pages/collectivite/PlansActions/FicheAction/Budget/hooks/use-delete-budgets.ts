import { trpc } from '@/api/utils/trpc/client';

export const useDeleteBudgets = () => {
  const utils = trpc.useUtils();

  return trpc.plans.fiches.budgets.delete.useMutation({
    onSuccess: () => {
      utils.plans.fiches.budgets.list.invalidate();
    },
  });
};
