import {useQuery} from 'react-query';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {ElsesCollectiviteRead, NiveauAcces} from 'generated/dataLayer';
import {MesCollectivitesRead} from 'generated/dataLayer/mes_collectivites_read';

export type CurrentCollectivite = {
  collectivite_id: number;
  nom: string;
  niveau_acces: NiveauAcces | null;
  isReferent: boolean;
  readonly: boolean;
};

// charge une collectivité depuis la vue des collectivitités associées à
// l'utilisateur courant
const fetchOwnedCollectivite = async (
  collectivite_id: number
): Promise<MesCollectivitesRead | null> => {
  const {error, data} = await supabaseClient
    .from<MesCollectivitesRead>('mes_collectivites')
    .select()
    .match({collectivite_id});

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
  const {error, data} = await supabaseClient
    .from<ElsesCollectiviteRead>('elses_collectivite')
    .select()
    .match({collectivite_id});

  if (error) {
    throw new Error(error.message);
  }

  return data && data.length ? data[0] : null;
};

// charge une collectivité
const fetchCurrentCollectivite = async (
  collectivite_id: number
): Promise<CurrentCollectivite | null> => {
  // vérifie si la collectivité est rattachée au compte courant
  const ownedCollectivite = await fetchOwnedCollectivite(collectivite_id);
  if (ownedCollectivite) {
    const {nom, niveau_acces} = ownedCollectivite;
    return {
      collectivite_id,
      nom,
      niveau_acces: niveau_acces as NiveauAcces,
      isReferent: niveau_acces === 'admin',
      readonly: false,
    };
  }

  // sinon charge ses données depuis la vue "elses_collectivite"
  const elseCollectivite = await fetchElsesCollectivite(collectivite_id);
  if (!elseCollectivite) {
    return null;
  }

  const {nom} = elseCollectivite;
  return {
    collectivite_id,
    nom,
    niveau_acces: null,
    isReferent: false,
    readonly: true,
  };
};

// charge la collectivité courante (à partir de son id)
// et détermine si elle est en lecture seule pour l'utilisateur courant ou non
// la requête est rechargée quand le user id ou le collectivite id changent
export const useCurrentCollectivite = () => {
  const {user} = useAuth() || {};
  const collectivite_id = useCollectiviteId();
  const {data} = useQuery<CurrentCollectivite | null>(
    ['current_collectivite', collectivite_id, user?.id],
    () => (collectivite_id ? fetchCurrentCollectivite(collectivite_id) : null)
  );
  return data || null;
};
