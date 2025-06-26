import { PanierAPI } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from '@tanstack/react-query';

/**
 * Charge le nombre d'actions présentes dans le panier d'une collectivité
 */
export const useNbActionsDansPanier = (collectiviteId: number | null) => {
  const supabase = useSupabase();
  const panierAPI = new PanierAPI(supabase);

  return useQuery({
    queryKey: ['nb_actions_dans_panier', collectiviteId],

    queryFn: async () => {
      console.log('collectiviteId', collectiviteId);
      if (!collectiviteId) return;
      return panierAPI.getCollectivitePanierInfo(collectiviteId);
    },
  });
};
