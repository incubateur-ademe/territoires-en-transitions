import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { Plan, PlanStatusEnum } from '@tet/domain/plans';

const IMPORTING_PLAN_REFETCH_INTERVAL_MS = 5_000;

export const useGetPlan = (
  planId: number,
  options?: {
    initialData: Plan;
  }
): Plan | undefined => {
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.plans.plans.get.queryOptions(
      { planId },
      {
        ...options,
        // Ouvert pendant l'import, le plan doit apparaître dès qu'il est rempli.
        refetchInterval: (query) =>
          query.state.data?.status === PlanStatusEnum.IMPORTING
            ? IMPORTING_PLAN_REFETCH_INTERVAL_MS
            : false,
      }
    )
  );
  return data;
};
