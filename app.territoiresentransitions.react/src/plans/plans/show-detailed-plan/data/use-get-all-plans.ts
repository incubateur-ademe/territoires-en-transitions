import { trpc } from '@/api/utils/trpc/client';
import {
  DetailedPlan,
  DetailedPlansResponse,
} from '@/backend/plans/plans/plans.schema';

export const useGetAllPlans = (
  collectiviteId: number,
  {
    initialData,
    limit,
  }: {
    initialData?: DetailedPlansResponse;
    limit?: number;
  }
): {
  plans: DetailedPlan[];
  totalCount: number;
  isLoading: boolean;
  error: any;
} => {
  const { data, isLoading, error } = trpc.plans.plans.getDetailedPlans.useQuery(
    {
      collectiviteId,
      ...(limit && { limit }),
    },
    {
      initialData,
    }
  );
  console.log('data', data, isLoading, error);
  return {
    plans: data?.plans ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    error,
  };
};
