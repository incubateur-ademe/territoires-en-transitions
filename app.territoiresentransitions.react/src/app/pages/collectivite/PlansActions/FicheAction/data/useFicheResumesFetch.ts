import { trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { GetFichesRequestType } from '@/backend/plans/fiches/shared/get-fiches-filter.request';

export type GetFichesOptions = Omit<GetFichesRequestType, 'collectiviteId'>;

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
