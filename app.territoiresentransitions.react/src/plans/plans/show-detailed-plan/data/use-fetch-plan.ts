import { trpc } from '@/api/utils/trpc/client';
import { DetailedPlan } from '@/backend/plans/plans/plans.schema';

export const useFetchPlan = (
  planActionId: number,
  {
    initialData,
  }: {
    initialData: DetailedPlan;
  }
): DetailedPlan => {
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
