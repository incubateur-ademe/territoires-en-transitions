import { trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { GetFichesRequestType } from '@/backend/plans/fiches/shared/fetch-fiches-filter.request';

export type GetFichesOptions = Omit<GetFichesRequestType, 'collectiviteId'>;

export const useFicheResumesFetch = (options?: GetFichesOptions) => {
  const collectiviteId = useCollectiviteId();

  return trpc.plans.fiches.listResumes.useQuery({
    collectiviteId: collectiviteId,
    filters: options?.filters,
    queryOptions: options?.queryOptions,
  });
};
