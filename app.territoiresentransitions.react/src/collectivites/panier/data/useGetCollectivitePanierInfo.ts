import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { fetchCollectivitePanierInfo } from '@/app/collectivites/panier/data/fetchCollectivitePanierInfo';
import { useQuery } from 'react-query';

export const useGetCollectivitePanierInfo = (collectiviteId: number | null) => {
  const supabase = useSupabase();

  const { data } = useQuery(
    ['collectivite_panier_info', collectiviteId],
    async () => {
      if (!collectiviteId) return;
      return fetchCollectivitePanierInfo(supabase, collectiviteId);
    }
  );

  return { panier: data ?? null };
};
