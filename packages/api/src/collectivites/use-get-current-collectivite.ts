"use client"
import {
  CollectiviteNiveauAcces,
  fetchCollectiviteNiveauAcces,
} from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from 'react-query';

// charge la collectivité courante (à partir de son id)
// et détermine si elle est en lecture seule pour l'utilisateur courant ou non
// la requête est rechargée quand le collectivite id change
export const useGetCurrentCollectivite = (
  collectiviteId: number
): CollectiviteNiveauAcces | null => {
  const supabase = useSupabase();

  const { data } = useQuery<CollectiviteNiveauAcces | null>(
    ['current_collectivite', collectiviteId],
    async (): Promise<CollectiviteNiveauAcces | null> => {
      if (!collectiviteId) return null;
      return fetchCollectiviteNiveauAcces(supabase, collectiviteId);
    }
  );

  return data ?? null;
};
