import { RouterInput, trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';

type ListFichesRequest = RouterInput['plans']['fiches']['listResumes'];
export type GetFichesOptions = Omit<ListFichesRequest, 'collectiviteId'>;

export const useFicheResumesFetch = (
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
