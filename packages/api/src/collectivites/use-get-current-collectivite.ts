'use client';
import {
  CurrentCollectivite,
  fetchCurrentCollectivite,
} from '@/api/collectivites/fetch-current-collectivite';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from '@tanstack/react-query';

// charge la collectivité courante (à partir de son id)
// et détermine si elle est en lecture seule pour l'utilisateur courant ou non
// la requête est rechargée quand le collectivite id change
export const useGetCurrentCollectivite = (
  collectiviteId: number
): CurrentCollectivite | null => {
  const supabase = useSupabase();

  const { data } = useQuery({
    queryKey: ['current_collectivite', collectiviteId],
    queryFn: async (): Promise<CurrentCollectivite | null> => {
      if (!collectiviteId) return null;
      return fetchCurrentCollectivite(supabase, collectiviteId);
    },
  });

  return data ?? null;
};
