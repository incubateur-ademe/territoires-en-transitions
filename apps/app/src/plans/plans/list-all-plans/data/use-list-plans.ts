import { RouterOutput, useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

export type PlanListItem =
  RouterOutput['plans']['plans']['list']['plans'][number];

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
  } = {}
): {
  plans: PlanListItem[];
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
