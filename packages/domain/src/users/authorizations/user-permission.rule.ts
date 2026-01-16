import { PermissionOperation } from './permission-operation.enum.schema';
import { ResourceType } from './resource-type.enum.schema';
import { UserRolesAndPermissions } from './user-roles-and-permissions.schema';

function hasPermission({
  userPermissions,
  resourceType = ResourceType.PLATEFORME,
  resourceId,
  operation,
}: {
  userPermissions: UserRolesAndPermissions | null;
  resourceType: ResourceType;
  resourceId: number | null;
  operation: PermissionOperation;
}): boolean {
  if (!userPermissions) {
    return false;
  }

  const hasPermissionForPlatform =
    userPermissions.permissions.includes(operation);

  if (resourceType === ResourceType.PLATEFORME) {
    return hasPermissionForPlatform;
  }

  const hasPermissionForCollectivite = userPermissions.collectivites.some(
    (collectivite) =>
      collectivite.collectiviteId === resourceId &&
      collectivite.permissions.includes(operation)
  );

  if (resourceType === ResourceType.COLLECTIVITE) {
    return hasPermissionForCollectivite || hasPermissionForPlatform;
  }

  const hasPermissionForAudit = userPermissions.audits.some(
    (audit) =>
      audit.auditId === resourceId && audit.permissions.includes(operation)
  );

  if (resourceType === ResourceType.AUDIT) {
    return hasPermissionForAudit || hasPermissionForPlatform;
  }

  return false;
}

// function hasPermissionCombination({
//   userPermissions,
//   resourceType = ResourceType.PLATEFORME,
//   resourceId,
//   operations,
// }: {
//   userPermissions: UserPermissions | null;
//   resourceType: ResourceType;
//   resourceId: number | null;
//   operation: PermissionOperationCombination;
// }): boolean {
//   return true;
// }

export const UserPermissionRule = {
  hasPermission,
};
