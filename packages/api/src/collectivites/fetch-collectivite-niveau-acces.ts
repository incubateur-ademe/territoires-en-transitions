import { Database, DBClient } from '@/api';
import { PermissionLevel } from '@/domain/users';

type DBCollectiviteNiveauAcces =
  Database['public']['Views']['collectivite_niveau_acces']['Row'];

export type CollectiviteNiveauAcces = {
  collectiviteId: number;
  nom: string;
  niveauAcces: PermissionLevel | null;
  accesRestreint: boolean;
  isRoleAuditeur: boolean;
  role: 'auditeur' | null;
  isReadOnly: boolean;
};

const toCurrentCollectiviteNiveauAcces = (
  collectiviteId: number,
  collectivite: DBCollectiviteNiveauAcces
): CollectiviteNiveauAcces => {
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

export const fetchCollectiviteNiveauAcces = async (
  supabase: DBClient,
  collectiviteId: number
): Promise<CollectiviteNiveauAcces | null> => {
  const { data, error } = await supabase
    .from('collectivite_niveau_acces')
    .select()
    .match({ collectivite_id: collectiviteId });

  if (error || data.length === 0) {
    return null;
  }

  return toCurrentCollectiviteNiveauAcces(collectiviteId, data[0]);
};
