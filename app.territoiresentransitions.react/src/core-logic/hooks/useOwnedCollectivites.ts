import { MaCollectivite } from '@tet/api';
import { planActionsPilotableFetch } from '@tet/api/plan-actions';
import { useAuth } from 'core-logic/api/auth/AuthProvider';
import { supabaseClient } from 'core-logic/api/supabase';
import { useQuery } from 'react-query';

// charge les collectivités associées au compte de l'utilisateur courant
// (identifié à partir du token passant dans toutes les requêtes)
export const fetchOwnedCollectivites = async () => {
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
  return sansCollectivite ?? true;
};

// une variante qui renvoi aussi les plans d'actions pilotables de la 1ère collectivité
export const usePlanActionsPilotableFetch = (
  collectiviteId: number | null | undefined
) => {
  return useQuery(
    ['plans_action_pilotable_fetch', collectiviteId],
    async () => {
      if (!collectiviteId) {
        return { plans: null };
      }

      const plans = await planActionsPilotableFetch({
        dbClient: supabaseClient,
        collectiviteId,
      });

      return { plans };
    }
  );
};

export type TMesCollectivites = Awaited<
  ReturnType<typeof fetchOwnedCollectivites>
>;
