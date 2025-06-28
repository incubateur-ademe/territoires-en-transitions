import { useTRPC } from '@/api/utils/trpc/client';
import { ListPlansResponse, Plan } from '@/domain/plans/plans';
import { useQuery } from '@tanstack/react-query';

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
  const trpc = useTRPC();
  const { data, isLoading, error } = useQuery(
    trpc.plans.plans.list.queryOptions(
      {
        collectiviteId,
        ...(limit && { limit }),
        ...(page && { page }),
        ...(sort && { sort }),
      },
      {
        initialData,
      }
    )
  );
  return {
    plans: data?.plans ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    error,
  };
};
