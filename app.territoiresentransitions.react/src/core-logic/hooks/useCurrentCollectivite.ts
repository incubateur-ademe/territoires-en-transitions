import {useQuery} from 'react-query';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {NiveauAcces} from 'generated/dataLayer';

export type CurrentCollectivite = {
  collectivite_id: number;
  nom: string;
  niveau_acces: NiveauAcces | null;
  isAdmin: boolean;
  est_auditeur: boolean;
  readonly: boolean;
};

// charge une collectivité
const fetchCurrentCollectivite = async (collectivite_id: number) => {
  const {data} = await supabaseClient
    .from('collectivite_niveau_acces')
    .select()
    .match({collectivite_id});

  const collectivite = data![0];

  return collectivite
    ? ({
        collectivite_id,
        nom: collectivite.nom,
        niveau_acces: collectivite.niveau_acces,
        isAdmin: collectivite.niveau_acces === 'admin',
        est_auditeur: collectivite.est_auditeur,
        readonly:
          collectivite.niveau_acces === null ||
          collectivite.niveau_acces === 'lecture',
      } as CurrentCollectivite)
    : null;
};

// charge la collectivité courante (à partir de son id)
// et détermine si elle est en lecture seule pour l'utilisateur courant ou non
// la requête est rechargée quand le user id ou le collectivite id changent
export const useCurrentCollectivite = () => {
  const {user} = useAuth() || {};
  const collectivite_id = useCollectiviteId();
  const {data} = useQuery(
    ['current_collectivite', collectivite_id, user?.id],
    () => (collectivite_id ? fetchCurrentCollectivite(collectivite_id) : null)
  );
  return data || null;
};
