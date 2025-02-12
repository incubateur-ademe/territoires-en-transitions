'use client';

import { useUser } from '@/api/users/user-provider';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from 'react-query';

/** Indique si l'utilisateur courant n'est pas associé à au moins une collectivité */

export const useSansCollectivite = () => {
  const user = useUser();
  const supabase = useSupabase();

  const { data: sansCollectivite } = useQuery(
    ['sans_collectivite', user.id],
    async () => {
      if (!user) return null;

      const { count } = await supabase
        .from('mes_collectivites')
        .select(undefined, { head: true, count: 'exact' });
      return count === null ? null : count === 0;
    }
  );
  return sansCollectivite;
};
