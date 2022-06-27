import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {supabaseClient} from 'core-logic/api/supabase';
import {ElsesCollectiviteRead, RoleName} from 'generated/dataLayer';
import {OwnedCollectiviteRead} from 'generated/dataLayer/owned_collectivite_read';
import {useQuery} from 'react-query';
import {useCollectiviteId} from './params';

export type CurrentCollectivite = {
  collectivite_id: number;
  nom: string;
  role_name: RoleName | null;
  isReferent: boolean;
  readonly: boolean;
};

// charge une collectivité depuis la vue des collectivitités associées à
// l'utilisateur courant
const fetchOwnedCollectivite = async (
  collectivite_id: number
): Promise<OwnedCollectiviteRead | null> => {
  const query = supabaseClient
    .from<OwnedCollectiviteRead>('owned_collectivite')
    .select()
    .match({collectivite_id});
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data && data.length ? data[0] : null;
};

// charge une collectivité depuis la vue des collectivitités NON associées à
// l'utilisateur courant
const fetchElsesCollectivite = async (
  collectivite_id: number
): Promise<ElsesCollectiviteRead | null> => {
  const query = supabaseClient
    .from<ElsesCollectiviteRead>('elses_collectivite')
    .select()
    .match({collectivite_id});
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data && data.length ? data[0] : null;
};

// charge une collectivité
const fetchCurrentCollectivite = async (
  collectivite_id: number | null
): Promise<CurrentCollectivite | null> => {
  if (!collectivite_id) {
    return null;
  }

  const ownedCollectivite = await fetchOwnedCollectivite(collectivite_id);
  if (ownedCollectivite) {
    const {nom, role_name} = ownedCollectivite;
    return {
      collectivite_id,
      nom,
      role_name: role_name as RoleName,
      isReferent: role_name === 'referent',
      readonly: false,
    };
  }

  const elseCollectivite = await fetchElsesCollectivite(collectivite_id);
  if (!elseCollectivite) {
    return null;
  }

  const {nom} = elseCollectivite;
  return {
    collectivite_id,
    nom,
    role_name: null,
    isReferent: false,
    readonly: true,
  };
};

// charge la collectivité courante (à partir de son id)
// et détermine si elle est en lecture seule pour l'utilisateur courant ou non
// la requête est rechargée quand le user id ou le collectivite id changent
export const useCurrentCollectivite = () => {
  const {user} = useAuth();
  const collectivite_id = useCollectiviteId();
  const {data} = useQuery<CurrentCollectivite | null>(
    ['current_collectivite', user?.id, collectivite_id],
    () => fetchCurrentCollectivite(collectivite_id)
  );
  return data || null;
};
