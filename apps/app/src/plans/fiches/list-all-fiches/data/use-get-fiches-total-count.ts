import { useCollectiviteId } from '@/api/collectivites';
import {
  GetFichesOptions,
  useListFiches,
} from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';

/**
 * TODO: not really optimized, because we are still fetching the fiche with another sql query
 * We should have another trpc endpoint
 */
export const useGetFichesTotalCount = () => {
  const collectiviteId = useCollectiviteId();
  const ficheResumesOptions: GetFichesOptions = {
    filters: {},
    queryOptions: {
      page: 1,
      limit: 1,
    },
  };
  const { data: ficheResumes, isLoading } = useListFiches(
    collectiviteId,
    ficheResumesOptions
  );

  return {
    count: ficheResumes?.count,
    isLoading,
  };
};
