import { CollectiviteEngagee } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { NB_CARDS_PER_PAGE } from '@/app/app/pages/CollectivitesEngagees/data/utils';
import { useQuery } from 'react-query';

/**
 * Renvoi une liste de plans en fonction d'un ensemble de filtres
 */
export const useFilteredPlans = (args: CollectiviteEngagee.Filters) => {
  const supabase = useSupabase();
  const collectiviteEngageeAPI = new CollectiviteEngagee.API(supabase);

  const { data, isLoading } = useQuery(['plan_card', args], () =>
    collectiviteEngageeAPI.fetchPlans(args, NB_CARDS_PER_PAGE)
  );

  return {
    isLoading,
    plans: data?.plans || [],
    plansCount: data?.plansCount || 0,
  };
};
