import { useCollectiviteId } from '@/api/collectivites';
import { RouterInput, RouterOutput, useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

type ListFichesInput = RouterInput['plans']['fiches']['listResumes'];
export type GetFichesOptions = Omit<ListFichesInput, 'collectiviteId'>;

export type ListFicheResumesOutput =
  RouterOutput['plans']['fiches']['listResumes'];

export const useListFicheResumes = (
  options?: GetFichesOptions,
  requested = true
) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  return useQuery(
    trpc.plans.fiches.listResumes.queryOptions(
      {
        collectiviteId,
        filters: options?.filters,
        queryOptions: options?.queryOptions,
      },
      { enabled: requested }
    )
  );
};
