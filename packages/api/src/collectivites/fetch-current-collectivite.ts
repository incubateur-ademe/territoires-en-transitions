import { PermissionLevel } from '@/domain/users';
import { MesCollectivites } from '../typeUtils';

export type CurrentCollectivite = {
  collectiviteId: number;
  nom: string;
  niveauAcces: PermissionLevel | null;
  accesRestreint: boolean;
  isRoleAuditeur: boolean;
  role: 'auditeur' | null;
  isReadOnly: boolean;
};

export const toCurrentCollectivite = (
  collectivite: MesCollectivites
): CurrentCollectivite => {
  return {
    // Le type des champs générés par supabase pour une vue SQL perdent leur caractéristique not-nullable.
    // D'où le cast explicite.
    collectiviteId: collectivite.collectivite_id as number,
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
