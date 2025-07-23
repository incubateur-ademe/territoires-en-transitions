import { trpc } from '@/api/utils/trpc/client';
import { Plan } from '@/domain/plans/plans';

export const useGetPlan = (
  planActionId: number,
  {
    initialData,
  }: {
    initialData: Plan;
  }
): Plan => {
  const { data } = trpc.plans.plans.get.useQuery(
    {
      planId: planActionId,
    },
    {
      initialData,
    }
  );
  return data;
};
