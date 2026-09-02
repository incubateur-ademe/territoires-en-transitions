import { QueryObserverResult, useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

export type PlanListItem =
  RouterOutput['plans']['plans']['list']['plans'][number];

type ListPlansOutput = RouterOutput['plans']['plans']['list'];

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
  error: unknown;
  refetch: () => Promise<QueryObserverResult<ListPlansOutput, unknown>>;
} => {
  const trpc = useTRPC();

  const { data, isLoading, error, refetch } = useQuery(
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
    refetch,
  };
};
