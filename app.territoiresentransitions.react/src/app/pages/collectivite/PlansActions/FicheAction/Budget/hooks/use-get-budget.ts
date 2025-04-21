import { RouterOutput, trpc } from '@/api/utils/trpc/client';

export type BudgetType =
  RouterOutput['plans']['fiches']['budgets']['list'][number];

export const useGetBudget = ({ ficheId }: { ficheId: number }) => {
  return trpc.plans.fiches.budgets.list.useQuery({ ficheId });
};
