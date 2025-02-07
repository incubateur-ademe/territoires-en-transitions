'use client';

import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useUser } from '@/app/users/user-provider';
import { useQuery } from 'react-query';

/** Indique si l'utilisateur courant n'est pas associé à au moins une collectivité */

export const useSansCollectivite = () => {
  const user = useUser();
  const { data: sansCollectivite } = useQuery(
    ['sans_collectivite', user.id],
    async () => {
      if (!user) return null;

      const { count } = await supabaseClient
        .from('mes_collectivites')
        .select(undefined, { head: true, count: 'exact' });
      return count === null ? null : count === 0;
    }
  );
  return sansCollectivite;
};
