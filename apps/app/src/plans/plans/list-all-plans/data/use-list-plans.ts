import { useTRPC } from '@/api/utils/trpc/client';
import { Plan } from '@/domain/plans/plans';
import { useQuery } from '@tanstack/react-query';

export const useListPlans = (
  collectiviteId: number,
  {
    limit,
    page,
    sort,
  }: {
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
    trpc.plans.plans.list.queryOptions({
      collectiviteId,
      limit,
      page,
      sort,
    })
  );
  return {
    plans: data?.plans ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    error,
  };
};
