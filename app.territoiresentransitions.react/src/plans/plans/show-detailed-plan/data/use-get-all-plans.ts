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
    page,
    sort,
  }: {
    initialData?: DetailedPlansResponse;
    limit?: number;
    page?: number;
    sort?: {
      field: 'nom' | 'createdAt' | 'type';
      direction: 'asc' | 'desc';
    };
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
      ...(page && { page }),
      ...(sort && { sort }),
    },
    {
      initialData,
    }
  );
  return {
    plans: data?.plans ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    error,
  };
};
