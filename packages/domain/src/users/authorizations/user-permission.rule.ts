import { PermissionOperation } from './permission-operation.enum.schema';
import {
  AuditRole,
  CollectiviteRole,
  isAuditRole,
  isCollectiviteRole,
  isPlatformRole,
  PlatformRole,
} from './user-role.enum.schema';
import {
  CollectiviteRolesAndPermissions,
  UserRolesAndPermissions,
} from './user-roles-and-permissions.schema';

export function hasPermission(
  user: UserRolesAndPermissions | null,
  operation: PermissionOperation,
  resource: { collectiviteId?: number; auditId?: number } = {}
): boolean {
  if (!user) {
    return false;
  }

  const hasPermissionForPlatform = user.permissions.includes(operation);

  if (!resource.collectiviteId && !resource.auditId) {
    return hasPermissionForPlatform;
  }

  if (resource.collectiviteId) {
    const hasPermissionForCollectivite = user.collectivites.some(
      (collectivite) =>
        collectivite.collectiviteId === resource.collectiviteId &&
        (collectivite.permissions.includes(operation) ||
          collectivite.audits.some((audit) =>
            audit.permissions.includes(operation)
          ))
    );

    return hasPermissionForCollectivite || hasPermissionForPlatform;
  }

  if (resource.auditId) {
    const hasPermissionForAudit = user.collectivites.some((collectivite) =>
      collectivite.audits.some(
        (audit) =>
          audit.auditId === resource.auditId &&
          audit.permissions.includes(operation)
      )
    );

    return hasPermissionForAudit || hasPermissionForPlatform;
  }

  return false;
}

export function hasRole(
  user: UserRolesAndPermissions,
  role: PlatformRole | CollectiviteRole | AuditRole,
  resource: { collectiviteId?: number; auditId?: number } = {}
): boolean {
  if (isPlatformRole(role)) {
    return user.roles.includes(role);
  }

  if (isCollectiviteRole(role) && resource.collectiviteId) {
    return user.collectivites.some(
      (collectivite) =>
        collectivite.collectiviteId === resource.collectiviteId &&
        collectivite.role === role
    );
  }

  if (isAuditRole(role)) {
    if (resource.auditId) {
      return user.collectivites.some((collectivite) =>
        collectivite.audits.some(
          (audit) => audit.auditId === resource.auditId && audit.role === role
        )
      );
    }
    if (resource.collectiviteId) {
      return user.collectivites.some(
        (collectivite) =>
          collectivite.collectiviteId === resource.collectiviteId &&
          collectivite.audits.some((audit) => audit.role === role)
      );
    }
  }

  return false;
}

export function hasCollectiviteRole(
  collectivite: CollectiviteRolesAndPermissions,
  role: CollectiviteRole | AuditRole
): boolean {
  if (isCollectiviteRole(role)) {
    return collectivite.role === role;
  }

  if (isAuditRole(role)) {
    return collectivite.audits.some((audit) => audit.role === role);
  }

  return false;
}

export function hasAnyCollectiviteRole(
  user: UserRolesAndPermissions,
  { collectiviteId }: { collectiviteId: number }
) {
  return user.collectivites.some(
    (collectivite) =>
      collectivite.collectiviteId === collectiviteId &&
      (collectivite.role !== null ||
        collectivite.audits.some((audit) => audit.role !== null))
  );
}

export function isUserVisitor(
  user: UserRolesAndPermissions,
  { collectiviteId }: { collectiviteId: number }
): boolean {
  if (hasRole(user, PlatformRole.SUPER_ADMIN)) {
    return false;
  }

  if (hasAnyCollectiviteRole(user, { collectiviteId })) {
    return false;
  }

  return true;
}

export const UserPermissionRule = {
  hasPermission,
  hasRole,
};
