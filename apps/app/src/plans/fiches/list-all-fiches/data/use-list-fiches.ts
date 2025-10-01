import { useTRPC } from '@/api/utils/trpc/client';
import {
  ListFichesRequestFilters,
  QueryOptionsSchema,
  SortOptions,
} from '@/domain/plans/fiches';
import { useQuery, useQueryClient } from '@tanstack/react-query';
export type GetFichesOptions = Partial<{
  filters: Omit<ListFichesRequestFilters, 'collectiviteId'>;
  queryOptions: QueryOptionsSchema;
}>;

export const useListFilteredFiches = (
  collectiviteId: number,
  options?: GetFichesOptions,
  requested = true
) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.plans.fiches.listFilteredFiches.queryOptions(
      {
        collectiviteId,
        filters: options?.filters,
        queryOptions: options?.queryOptions,
      },
      {
        enabled: requested,
      }
    )
  );
};

export const useListAllFilteredFiches = ({
  collectiviteId,
  filters,
  sort,
  requested,
}: {
  collectiviteId: number;
  filters: GetFichesOptions['filters'];
  sort: SortOptions;
  requested?: boolean;
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return {
    listAllFilteredFiches: () =>
      queryClient.fetchQuery(
        trpc.plans.fiches.listFilteredFiches.queryOptions(
          {
            collectiviteId,
            filters: filters,
            queryOptions: {
              sort,
              limit: 'all',
            },
          },
          {
            enabled: requested === true,
          }
        )
      ),
  };
};
