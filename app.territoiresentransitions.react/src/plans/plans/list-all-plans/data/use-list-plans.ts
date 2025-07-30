import { trpc } from '@/api/utils/trpc/client';
import { ListPlansResponse, Plan } from '@/domain/plans/plans';

export const useListPlans = (
  collectiviteId: number,
  {
    initialData,
    limit,
    page,
    sort,
  }: {
    initialData?: ListPlansResponse;
    limit?: number;
    page?: number;
    sort?: {
      field: 'nom' | 'createdAt' | 'type';
      direction: 'asc' | 'desc';
    };
  }
): {
  plans: Plan[];
  totalCount: number;
  isLoading: boolean;
  error: any;
} => {
  const { data, isLoading, error } = trpc.plans.plans.list.useQuery(
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
