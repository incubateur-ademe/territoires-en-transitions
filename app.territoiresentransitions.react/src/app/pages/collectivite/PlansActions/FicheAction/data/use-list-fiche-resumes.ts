import { useCollectiviteId } from '@/api/collectivites';
import { RouterInput, RouterOutput, trpc } from '@/api/utils/trpc/client';

type ListFichesInput = RouterInput['plans']['fiches']['listResumes'];
export type GetFichesOptions = Omit<ListFichesInput, 'collectiviteId'>;

export type ListFicheResumesOutput =
  RouterOutput['plans']['fiches']['listResumes'];

export const useListFicheResumes = (
  options?: GetFichesOptions,
  requested = true
) => {
  const collectiviteId = useCollectiviteId();

  return trpc.plans.fiches.listResumes.useQuery(
    {
      collectiviteId,
      filters: options?.filters,
      queryOptions: options?.queryOptions,
    },
    { enabled: requested }
  );
};
