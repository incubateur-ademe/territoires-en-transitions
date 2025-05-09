import { trpc } from '@/api/utils/trpc/client';

export const useUpsertBudgets = () => {
  const utils = trpc.useUtils();

  return trpc.plans.fiches.budgets.upsert.useMutation({
    onSuccess: () => {
      utils.plans.fiches.budgets.list.invalidate();
    },
  });
};
