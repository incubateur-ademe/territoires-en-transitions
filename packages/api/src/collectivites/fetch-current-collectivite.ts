import { Database, DBClient } from '@/api';
import { PermissionLevel } from '@/domain/users';

type DBCollectiviteNiveauAcces =
  Database['public']['Views']['collectivite_niveau_acces']['Row'];

export type CurrentCollectivite = {
  collectiviteId: number;
  nom: string;
  niveauAcces: PermissionLevel | null;
  accesRestreint: boolean;
  isRoleAuditeur: boolean;
  role: 'auditeur' | null;
  isReadOnly: boolean;
};

const toCurrentCollectivite = (
  collectiviteId: number,
  collectivite: DBCollectiviteNiveauAcces
): CurrentCollectivite => {
  return {
    collectiviteId,
    nom: collectivite.nom || '',
    niveauAcces: collectivite.niveau_acces,
    isRoleAuditeur: collectivite.est_auditeur || false,
    role: collectivite.est_auditeur ? ('auditeur' as const) : null,
    accesRestreint: collectivite.access_restreint || false,
    isReadOnly:
      (collectivite.niveau_acces === null ||
        collectivite.niveau_acces === 'lecture') &&
      !collectivite.est_auditeur,
  };
};

export const fetchCurrentCollectivite = async (
  supabase: DBClient,
  collectiviteId: number
): Promise<CurrentCollectivite | null> => {
  const { data, error } = await supabase
    .from('collectivite_niveau_acces')
    .select()
    .match({ collectivite_id: collectiviteId });

  if (error || data.length === 0) {
    return null;
  }

  return toCurrentCollectivite(collectiviteId, data[0]);
};
