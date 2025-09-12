import { useTRPC } from '@/api/utils/trpc/client';
import { ListFichesRequestWithLimit } from '@/domain/plans/fiches';
import { useQuery } from '@tanstack/react-query';

export type GetFichesOptions = Omit<
  ListFichesRequestWithLimit,
  'collectiviteId'
>;

export const useListFiches = (
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
