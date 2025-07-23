import { RouterInput, RouterOutput, trpc } from '@/api/utils/trpc/client';

type ListFichesInput = RouterInput['plans']['fiches']['listResumes'];
export type GetFichesOptions = Omit<ListFichesInput, 'collectiviteId'>;

export type ListFicheResumesOutput =
  RouterOutput['plans']['fiches']['listResumes'];

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
