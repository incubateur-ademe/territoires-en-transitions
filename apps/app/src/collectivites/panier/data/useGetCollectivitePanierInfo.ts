import { useSupabase } from '@/api';
import { fetchCollectivitePanierInfo } from '@/app/collectivites/panier/data/fetchCollectivitePanierInfo';
import { useQuery } from '@tanstack/react-query';

export const useGetCollectivitePanierInfo = (collectiviteId: number | null) => {
  const supabase = useSupabase();

  const { data } = useQuery({
    queryKey: ['collectivite_panier_info', collectiviteId],
    queryFn: async () => {
      if (!collectiviteId) return null;
      return fetchCollectivitePanierInfo(supabase, collectiviteId);
    },
  });

  return { panier: data ?? null };
};
