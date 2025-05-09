import { RouterOutput, trpc } from '@/api/utils/trpc/client';

export type BudgetType =
  RouterOutput['plans']['fiches']['budgets']['list'][number];

export const useGetBudget = (
  { ficheId }: { ficheId: number },
  requested = true
) => {
  return trpc.plans.fiches.budgets.list.useQuery(
    { ficheId },
    { enabled: requested }
  );
};
