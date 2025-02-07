import { DBClient, MaCollectivite } from '@/api';
import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useAuth } from '@/app/users/auth-provider';
import { useQuery } from 'react-query';

// charge les collectivités associées au compte de l'utilisateur courant
// (identifié à partir du token passant dans toutes les requêtes)
export const fetchOwnedCollectivites = async (supabaseClient: DBClient) => {
  const query = supabaseClient
    .from('mes_collectivites')
    .select()
    .returns<MaCollectivite[]>();

  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

/** Indique si l'utilisateur courant n'est pas associé à au moins une collectivité */
export const useSansCollectivite = () => {
  const { user, isConnected } = useAuth();
  const { data: sansCollectivite } = useQuery(
    ['sans_collectivite', user?.id],
    async () => {
      if (!isConnected) return null;

      const { count } = await supabaseClient
        .from('mes_collectivites')
        .select(undefined, { head: true, count: 'exact' });
      return count === null ? null : count === 0;
    }
  );
  return sansCollectivite;
};

export type TMesCollectivites = Awaited<
  ReturnType<typeof fetchOwnedCollectivites>
>;
