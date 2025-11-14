import { useTRPC } from '@/api';
import { Plan } from '@/domain/plans';
import { useQuery } from '@tanstack/react-query';

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
