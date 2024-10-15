import { useQuery } from 'react-query';
import { TAuthContext, useAuth } from 'core-logic/api/auth/AuthProvider';
import { supabaseClient } from 'core-logic/api/supabase';
import { planActionsPilotableFetch } from '@tet/api/plan-actions';
import { MaCollectivite } from '@tet/api';

// charge les collectivités associées au compte de l'utilisateur courant
// (identifié à partir du token passant dans toutes les requêtes)
const fetchOwnedCollectivites = async () => {
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

// donne accès aux collectivités associées au compte de l'utilisateur courant
// la requête est rechargée quand le user id change
export const useOwnedCollectivites = (userId: string | undefined) => {
  const { data } = useQuery(['mes_collectivites', userId], () =>
    userId ? fetchOwnedCollectivites() : null
  );
  return data ?? null;
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
export const useMesCollectivitesEtPlans = () => {
  const { user, isConnected } = useAuth();
  return useQuery(['mes_collectivites_et_plans', user?.id], async () => {
    if (!isConnected) return null;
    const collectivites = await fetchOwnedCollectivites();
    const collectiviteId = collectivites?.[0]?.collectivite_id;
    if (collectiviteId) {
      const plans = await planActionsPilotableFetch({
        dbClient: supabaseClient,
        collectiviteId,
      });
      return { collectivites, plans };
    }

    return { collectivites, plans: null };
  });
};

export type TMesCollectivites = ReturnType<typeof useOwnedCollectivites>;
