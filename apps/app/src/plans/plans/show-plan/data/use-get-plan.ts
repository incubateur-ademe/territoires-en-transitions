import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { Plan } from '@tet/domain/plans';

export const useGetPlan = (
  planId: number,
  options?: {
    initialData: Plan;
  }
): Plan | undefined => {
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.plans.plans.get.queryOptions({ planId }, options)
  );
  return data;
};
