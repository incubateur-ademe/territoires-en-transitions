import { PanierAPI } from '@/api';
import { SupabaseClient } from '@supabase/supabase-js';

export const fetchCollectivitePanierInfo = async (
  supabase: SupabaseClient,
  collectiviteId: number
) => {
  const panierAPI = new PanierAPI(supabase);
  return panierAPI.getCollectivitePanierInfo(collectiviteId);
};
