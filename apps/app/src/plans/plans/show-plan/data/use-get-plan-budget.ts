import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

// TODO
export const useGetPlanBudget = (planId: number) => {
  const trpc = useTRPC();
  return useQuery(trpc.plans.plans.get.queryOptions({ planId }));
};
