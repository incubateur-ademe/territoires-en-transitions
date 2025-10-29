import {
  AuditRole,
  CollectiviteAccess,
  CollectiviteAccessLevelEnum,
  PermissionOperation,
  permissionsByRole,
  Role,
} from '@/domain/users';
import { MesCollectivites } from '../typeUtils';

export const toCollectiviteAccess = (
  collectivite: MesCollectivites
): CollectiviteAccess => {
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
        collectivite.niveau_acces === CollectiviteAccessLevelEnum.LECTURE) &&
      !collectivite.est_auditeur,
    isSimplifiedView:
      collectivite.niveau_acces ===
      CollectiviteAccessLevelEnum.EDITION_FICHES_INDICATEURS,
  };
};
