import {
  AuditRole,
  PermissionLevel,
  PermissionOperation,
  permissionsByRole,
  Role,
} from '@/domain/users';
import { MesCollectivites } from '../typeUtils';

export type CurrentCollectivite = {
  collectiviteId: number;
  nom: string;
  niveauAcces: PermissionLevel | null;
  permissions?: PermissionOperation[];
  accesRestreint: boolean;
  isRoleAuditeur: boolean;
  isReadOnly: boolean;
};

export type CollectiviteAccess = {
  collectiviteId: number;
  nom: string;
  role: Role | null;

  permissions: PermissionOperation[];
  accesRestreint: boolean;
};

export const toCurrentCollectivite = (
  collectivite: MesCollectivites
): CurrentCollectivite => {
  const role: Role | null = collectivite.est_auditeur
    ? AuditRole.AUDITEUR
    : collectivite.niveau_acces;
  const permissionOperations: PermissionOperation[] = role
    ? permissionsByRole[role]
    : [];

  return {
    // Le type des champs générés par supabase pour une vue SQL perdent leur caractéristique not-nullable.
    // D'où le cast explicite.
    collectiviteId: collectivite.collectivite_id as number,
    nom: collectivite.nom || '',
    niveauAcces: collectivite.niveau_acces,
    isRoleAuditeur: collectivite.est_auditeur || false,
    permissions: permissionOperations,
    accesRestreint: collectivite.access_restreint || false,

    isReadOnly:
      (collectivite.niveau_acces === null ||
        collectivite.niveau_acces === 'lecture') &&
      !collectivite.est_auditeur,
  };
};
