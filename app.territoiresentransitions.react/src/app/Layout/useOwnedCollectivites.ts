import {useQuery} from 'react-query';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {supabaseClient} from 'core-logic/api/supabase';
import {OwnedCollectiviteRead} from 'generated/dataLayer/owned_collectivite_read';

// charge les collectivités associées au compte de l'utilisateur courant
// (identifié à partir du token passant dans toutes les requêtes)
const fetchOwnedCollectivites = async (): Promise<OwnedCollectiviteRead[]> => {
  const query = supabaseClient
    .from<OwnedCollectiviteRead>('owned_collectivite')
    .select();
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

// donne accès aux collectivités associées au compte de l'utilisateur courant
// la requête est rechargée quand le user id change
export const useOwnedCollectivites = () => {
  const {user} = useAuth();
  const {data} = useQuery(
    ['owned_collectivites', user?.id],
    fetchOwnedCollectivites
  );
  return data || null;
};
