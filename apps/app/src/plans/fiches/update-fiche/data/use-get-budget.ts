import { useQuery } from '@tanstack/react-query';
import { TRPCUseQueryResult, useTRPC } from '@tet/api';
import { FicheBudget } from '@tet/domain/plans';

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
