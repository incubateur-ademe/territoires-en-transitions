import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

export type PlanListItem =
  RouterOutput['plans']['plans']['list']['plans'][number];

export const useListPlans = (
  collectiviteId: number,
  {
    typeIds,
    limit,
    page,
    sort,
    enabled,
  }: {
    typeIds?: number[];
    limit?: number;
    page?: number;
    sort?: {
      field: 'nom' | 'createdAt' | 'type';
      direction: 'asc' | 'desc';
    };
    enabled?: boolean;
  } = {}
): {
  plans: PlanListItem[];
  totalCount: number;
  isLoading: boolean;
  error: any;
} => {
  const trpc = useTRPC();

  const { data, isLoading, error } = useQuery(
    trpc.plans.plans.list.queryOptions(
      {
        collectiviteId,
        typeIds,
        limit,
        page,
        sort,
      },
      { enabled }
    )
  );

  return {
    plans: data?.plans ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    error,
  };
};
