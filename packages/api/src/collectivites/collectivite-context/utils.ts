import { ReferentielId } from '@tet/domain/referentiels';
import {
  CollectiviteRole,
  hasPermission,
  isReferentielOperationAllowed,
  isUserAuditeur,
  PermissionOperation,
  UserWithRolesAndPermissions,
} from '@tet/domain/users';
import {
  CollectiviteCurrent,
  CollectiviteWithContexteInstruction,
} from './type';

export const toCollectiviteCurrent = (
  collectivite: CollectiviteWithContexteInstruction,
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

    hasReferentielPermission: (
      permission: PermissionOperation,
      referentielId: ReferentielId
    ) => {
      if (
        !hasPermission(user, permission, {
          collectiviteId: collectivite.collectiviteId,
        })
      ) {
        return false;
      }

      return isReferentielOperationAllowed(
        permission,
        referentielId,
        collectivite.collectivitePreferences.referentiels
      );
    },

    user,
  };
};
