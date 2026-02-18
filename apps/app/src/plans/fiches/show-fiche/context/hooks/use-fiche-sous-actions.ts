import { useListFiches } from '../../../list-all-fiches/data/use-list-fiches';
import { SousActionsState } from '../types';

export const useFicheSousActions = (
  ficheId: number,
  collectiviteId: number
): SousActionsState => {
  const {
    count: countSousActions,
    isLoading,
    fiches: sousActions,
  } = useListFiches(collectiviteId, {
    filters: { parentsId: [ficheId] },
    queryOptions: {
      sort: [{ field: 'created_at', direction: 'asc' }],
      limit: 'all',
    },
  });
  return {
    count: countSousActions,
    isLoading,
    list: sousActions,
  };
};
