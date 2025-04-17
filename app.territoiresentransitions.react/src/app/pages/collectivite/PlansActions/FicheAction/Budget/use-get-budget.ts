import { trpc } from '@/api/utils/trpc/client';

export const useGetBudget = ({ ficheId }: { ficheId: number }) => {
  return trpc.plans.fiches.budgets.list.useQuery({ ficheId });
};
