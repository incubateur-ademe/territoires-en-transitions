import { useQuery } from '@tanstack/react-query';
import { RouterOutput, TRPCUseQueryResult, useTRPC } from '@tet/api';

export type FicheBudget =
  RouterOutput['plans']['fiches']['budgets']['list'][number];

export const useGetBudget = (
  { ficheId }: { ficheId: number },
  requested = true
): TRPCUseQueryResult<FicheBudget[]> => {
  const trpc = useTRPC();

  return useQuery(
    trpc.plans.fiches.budgets.list.queryOptions(
      { ficheId },
      { enabled: requested }
    )
  );
};
