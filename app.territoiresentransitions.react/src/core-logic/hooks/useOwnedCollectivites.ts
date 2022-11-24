import {useQuery} from 'react-query';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {supabaseClient} from 'core-logic/api/supabase';

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
