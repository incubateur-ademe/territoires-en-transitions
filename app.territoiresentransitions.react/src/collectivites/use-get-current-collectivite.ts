import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { TNiveauAcces } from '@/app/types/alias';
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
  return data?.[0];
};

// charge la collectivité courante (à partir de son id)
// et détermine si elle est en lecture seule pour l'utilisateur courant ou non
// la requête est rechargée quand le collectivite id change
export const useGetCurrentCollectivite = (collectiviteId: number) => {
  const supabase = useSupabase();

  return useQuery(
    ['current_collectivite', collectiviteId],
    async (): Promise<CurrentCollectivite | null> => {
      const collectivite = await fetchCurrentCollectivite(
        supabase,
        collectiviteId
      );

      if (!collectivite) {
        return null;
      }

      return {
        collectiviteId,
        nom: collectivite.nom || '',
        niveauAcces: collectivite.niveau_acces,
        isRoleAuditeur: collectivite.est_auditeur || false,
        role: collectivite.est_auditeur ? 'auditeur' : null,
        accesRestreint: collectivite.access_restreint || false,
        isReadOnly:
          (collectivite.niveau_acces === null ||
            collectivite.niveau_acces === 'lecture') &&
          !collectivite.est_auditeur,
      };
    }
  );
};
