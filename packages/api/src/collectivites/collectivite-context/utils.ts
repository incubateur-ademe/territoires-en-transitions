import {
  CollectiviteRole,
  CollectiviteRolesAndPermissions,
  hasPermission,
  isUserAuditeur,
  PermissionOperation,
  UserWithRolesAndPermissions,
} from '@tet/domain/users';
import { CollectiviteCurrent } from './type';

export const toCollectiviteCurrent = (
  collectivite: CollectiviteRolesAndPermissions,
  user: UserWithRolesAndPermissions
): CollectiviteCurrent => {
  return {
    ...collectivite,

    nom: collectivite.collectiviteNom,
    accesRestreint: collectivite.collectiviteAccesRestreint,

    isSimplifiedView:
      collectivite.role === CollectiviteRole.EDITION_FICHES_INDICATEURS,

    isRoleAuditeur: isUserAuditeur(collectivite),

    hasCollectivitePermission: (permission: PermissionOperation) =>
      hasPermission(user, permission, {
        collectiviteId: collectivite.collectiviteId,
      }),

    user,
  };
};
