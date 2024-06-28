import {useQuery} from 'react-query';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {supabaseClient} from 'core-logic/api/supabase';
import {FicheActions} from '@tet/api';

// charge les collectivités associées au compte de l'utilisateur courant
// (identifié à partir du token passant dans toutes les requêtes)
const fetchOwnedCollectivites = async () => {
  const query = supabaseClient.from('mes_collectivites').select();
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

// donne accès aux collectivités associées au compte de l'utilisateur courant
// la requête est rechargée quand le user id change
export const useOwnedCollectivites = () => {
  const {user, isConnected} = useAuth();
  const {data} = useQuery(['mes_collectivites', user?.id], () =>
    isConnected ? fetchOwnedCollectivites() : null
  );
  return data || null;
};

// une variante qui renvoi aussi les plans d'actions pilotables de la 1ère collectivité
export const useMesCollectivitesEtPlans = () => {
  const {user, isConnected} = useAuth();
  return useQuery(['mes_collectivites_et_plans', user?.id], async () => {
    if (!isConnected) return null;
    const collectivites = await fetchOwnedCollectivites();
    const collectiviteId = collectivites?.[0]?.collectivite_id;
    if (collectiviteId) {
      const plans = await FicheActions.planActionsPilotableFetch({
        dbClient: supabaseClient,
        collectiviteId,
      });
      return {collectivites, plans};
    }

    return {collectivites, plans: null};
  });
};

export type TMesCollectivites = ReturnType<typeof useOwnedCollectivites>;
