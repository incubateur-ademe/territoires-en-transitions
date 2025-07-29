import { trpc } from '@/api/utils/trpc/client';
import { Plan } from '@/domain/plans/plans';

export const useGetPlan = (
  planId: number,
  {
    initialData,
  }: {
    initialData: Plan;
  }
): Plan => {
  const { data } = trpc.plans.plans.get.useQuery(
    {
      planId,
    },
    {
      initialData,
    }
  );
  return data;
};
