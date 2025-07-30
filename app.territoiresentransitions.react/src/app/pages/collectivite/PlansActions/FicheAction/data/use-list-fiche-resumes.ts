import { trpc } from '@/api/utils/trpc/client';
import { ListFichesInput } from '@/app/plans/fiches/_data/types';

export type GetFichesOptions = Omit<ListFichesInput, 'collectiviteId'>;

export const useListFicheResumes = (
  collectiviteId: number,
  options?: GetFichesOptions,
  requested = true
) => {
  return trpc.plans.fiches.listResumes.useQuery(
    {
      collectiviteId,
      filters: options?.filters,
      queryOptions: options?.queryOptions,
    },
    {
      enabled: requested,
    }
  );
};
