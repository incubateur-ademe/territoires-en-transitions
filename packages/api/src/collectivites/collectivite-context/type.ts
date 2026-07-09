import {
  CollectiviteRolesAndPermissions,
  PermissionOperation,
  UserInfo,
} from '@tet/domain/users';

export interface CollectiviteCurrent extends CollectiviteRolesAndPermissions {
  nom: string;
  accesRestreint: boolean;

  isRoleAuditeur: boolean;
  isSimplifiedView: boolean;

  hasCollectivitePermission: (permission: PermissionOperation) => boolean;

  // user info also here for convenience access
  user: UserInfo;
}
