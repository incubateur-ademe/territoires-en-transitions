import { useTRPC } from '@/api/utils/trpc/client';
import { ListFichesInput } from '@/app/plans/fiches/_data/types';
import { useQuery } from '@tanstack/react-query';

export type GetFichesOptions = Omit<ListFichesInput, 'collectiviteId'>;

export const useListFiches = (
  collectiviteId: number,
  options?: GetFichesOptions,
  requested = true
) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.plans.fiches.listResumes.queryOptions(
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
