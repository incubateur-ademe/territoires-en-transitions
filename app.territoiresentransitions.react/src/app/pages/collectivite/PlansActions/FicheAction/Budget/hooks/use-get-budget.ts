import { RouterOutput, useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

export type BudgetType =
  RouterOutput['plans']['fiches']['budgets']['list'][number];

export const useGetBudget = (
  { ficheId }: { ficheId: number },
  requested = true
) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.plans.fiches.budgets.list.queryOptions(
      { ficheId },
      { enabled: requested }
    )
  );
};
