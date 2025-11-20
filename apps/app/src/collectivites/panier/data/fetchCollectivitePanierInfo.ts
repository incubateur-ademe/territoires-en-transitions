import { SupabaseClient } from '@supabase/supabase-js';
import { PanierAPI } from '@tet/api';

export const fetchCollectivitePanierInfo = async (
  supabase: SupabaseClient,
  collectiviteId: number
) => {
  const panierAPI = new PanierAPI(supabase);
  return panierAPI.getCollectivitePanierInfo(collectiviteId);
};
