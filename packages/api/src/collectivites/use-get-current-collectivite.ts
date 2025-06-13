import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { PermissionLevel } from '@/domain/users';
import { useQuery } from 'react-query';
import { fetchCurrentCollectivite } from './fetch-current-collectivite';

export type CurrentCollectivite = {
  collectiviteId: number;
  nom: string;
  niveauAcces: PermissionLevel | null;
  accesRestreint: boolean;
  isRoleAuditeur: boolean;
  role: 'auditeur' | null;
  isReadOnly: boolean;
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

      return collectivite;
    }
  );
};
