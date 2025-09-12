import { useTRPC } from '@/api/utils/trpc/client';
import { ListFichesRequestWithLimit, SortOptions } from '@/domain/plans/fiches';
import { useQuery, useQueryClient } from '@tanstack/react-query';
export type GetFichesOptions = Omit<
  ListFichesRequestWithLimit,
  'collectiviteId'
>;

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
        trpc.plans.fiches.listAllFilteredFiches.queryOptions(
          {
            collectiviteId,
            filters: filters,
            queryOptions: {
              sort,
            },
          },
          { staleTime: 0 } //we always want to fetch the latest data
        )
      ),
  };
};
