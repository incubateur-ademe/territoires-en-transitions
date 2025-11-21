import { useCurrentCollectivite } from '@/api/collectivites';
import { useListFiches } from '../data/use-list-fiches';

export const useCountFiches = () => {
  const { collectiviteId } = useCurrentCollectivite();

  const { count: countFichesNonClassees } = useListFiches(collectiviteId, {
    filters: { noPlan: true },
    queryOptions: { limit: 1, page: 1 },
  });

  const { count: countFichesClassees } = useListFiches(collectiviteId, {
    filters: { noPlan: false },
    queryOptions: { limit: 1, page: 1 },
  });

  return {
    countFichesNonClassees,
    countFichesClassees,
    countTotalFiches: countFichesNonClassees + countFichesClassees,
  };
};
