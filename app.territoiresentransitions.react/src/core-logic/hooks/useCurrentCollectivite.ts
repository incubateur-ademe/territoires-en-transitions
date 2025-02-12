import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { TNiveauAcces } from '@/app/types/alias';
import { useUser } from '@/app/users/user-provider';
import { useQuery } from 'react-query';

export type CurrentCollectivite = {
  collectiviteId: number;
  nom: string;
  niveauAcces: TNiveauAcces | null;
  accesRestreint: boolean;
  isRoleAuditeur: boolean;
  role: 'auditeur' | null;
  isReadOnly: boolean;
};

// charge une collectivité
const fetchCurrentCollectivite = async (
  supabase: DBClient,
  collectivite_id: number
) => {
  const { data } = await supabase
    .from('collectivite_niveau_acces')
    .select()
    .match({ collectivite_id });

  const collectivite = data![0];
  return collectivite;
};

function toCurrentCollectivite(collectivite: any): CurrentCollectivite {
  return {
    collectiviteId: collectivite.collectivite_id,
    nom: collectivite.nom,
    niveauAcces: collectivite.niveau_acces,
    isRoleAuditeur: collectivite.est_auditeur,
    role: collectivite.est_auditeur ? 'auditeur' : null,
    accesRestreint: collectivite.access_restreint || false,
    isReadOnly:
      (collectivite.niveau_acces === null ||
        collectivite.niveau_acces === 'lecture') &&
      !collectivite.est_auditeur,
  };
}

// charge la collectivité courante (à partir de son id)
// et détermine si elle est en lecture seule pour l'utilisateur courant ou non
// la requête est rechargée quand le user id ou le collectivite id changent
export const useCurrentCollectivite = () => {
  const user = useUser();
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  const { data } = useQuery(
    ['current_collectivite', collectiviteId, user?.id],
    async () => {
      const collectivite = collectiviteId
        ? await fetchCurrentCollectivite(supabase, collectiviteId)
        : user?.collectivites?.length
        ? user.collectivites[0]
        : null;

      if (!collectivite) {
        return null;
      }

      return toCurrentCollectivite(collectivite);
    }
  );

  return data || null;
};
