import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { Plan } from '@tet/domain/plans';

export const useGetPlan = (
  planId: number,
  {
    initialData,
  }: {
    initialData: Plan;
  }
): Plan => {
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.plans.plans.get.queryOptions(
      { planId },
      {
        initialData,
      }
    )
  );
  return data;
};
