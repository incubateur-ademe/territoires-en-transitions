import { useQuery } from 'react-query';

import { PanierAPI } from '@/api';
import { supabaseClient } from '@/api/utils/supabase/browser-client';

const panierAPI = new PanierAPI(supabaseClient);

/**
 * Charge le nombre d'actions présentes dans le panier d'une collectivité
 */
export const useNbActionsDansPanier = (collectiviteId: number | null) => {
  return useQuery(['nb_actions_dans_panier', collectiviteId], async () => {
    if (!collectiviteId) return;
    return panierAPI.getCollectivitePanierInfo(collectiviteId);
  });
};
