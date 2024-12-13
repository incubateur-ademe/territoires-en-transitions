import { CollectiviteEngagee } from '@/api';
import { collectiviteEngageeAPI } from '@/app/core-logic/api/apis';
import { NB_CARDS_PER_PAGE } from 'app/pages/CollectivitesEngagees/data/utils';
import { useQuery } from 'react-query';

/**
 * Renvoi une liste de plans en fonction d'un ensemble de filtres
 */
export const useFilteredPlans = (args: CollectiviteEngagee.Filters) => {
  const { data, isLoading } = useQuery(['plan_card', args], () =>
    collectiviteEngageeAPI.fetchPlans(args, NB_CARDS_PER_PAGE)
  );

  return {
    isLoading,
    plans: data?.plans || [],
    plansCount: data?.plansCount || 0,
  };
};
