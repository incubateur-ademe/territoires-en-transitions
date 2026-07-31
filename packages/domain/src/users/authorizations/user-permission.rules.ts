import { canMutateReferentielData } from '../../collectivites/can-mutate-referentiel.rules';
import {
  isCollectiviteReferentielPreferenceId,
  type CollectiviteReferentielPreferences,
} from '../../collectivites/collectivite-preferences.schema';
import type { ReferentielId } from '../../referentiels/referentiel-id.enum';
import { isReferentielMutationOperation } from './is-referentiel-mutation-operation';
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

export type PermissionResource = {
  collectiviteId?: number;
  auditId?: number;
  referentielId?: ReferentielId;
};

/**
 * Returns false when a referentiel mutation is blocked by mode (readonly/archived).
 * Reads and referentiel ids without collectivité preferences (e.g. te-test) are always allowed by mode.
 */
export function isReferentielOperationAllowed(
  operation: PermissionOperation,
  referentielId: ReferentielId,
  referentielPreferences: CollectiviteReferentielPreferences
): boolean {
  if (!isReferentielMutationOperation(operation)) {
    return true;
  }

  if (!isCollectiviteReferentielPreferenceId(referentielId)) {
    return true;
  }

  return canMutateReferentielData(referentielPreferences[referentielId].mode);
}

export function hasPermission(
  user: UserRolesAndPermissions | null,
  operation: PermissionOperation,
  resource: PermissionResource = {}
): boolean {
  if (!user) {
    return false;
  }

  const hasPermissionForPlatform = user.permissions.includes(operation);

  if (!resource.collectiviteId && !resource.auditId) {
    return hasPermissionForPlatform;
  }

  let roleAllows = false;

  if (resource.collectiviteId) {
    const hasPermissionForCollectivite = user.collectivites.some(
      (collectivite) =>
        collectivite.collectiviteId === resource.collectiviteId &&
        (collectivite.permissions.includes(operation) ||
          collectivite.audits.some((audit) =>
            audit.permissions.includes(operation)
          ))
    );

    roleAllows = hasPermissionForCollectivite || hasPermissionForPlatform;
  } else if (resource.auditId) {
    const hasPermissionForAudit = user.collectivites.some((collectivite) =>
      collectivite.audits.some(
        (audit) =>
          audit.auditId === resource.auditId &&
          audit.permissions.includes(operation)
      )
    );

    roleAllows = hasPermissionForAudit || hasPermissionForPlatform;
  }

  if (!roleAllows) {
    return false;
  }

  if (resource.collectiviteId && resource.referentielId) {
    const collectivite = user.collectivites.find(
      (c) => c.collectiviteId === resource.collectiviteId
    );

    if (collectivite) {
      return isReferentielOperationAllowed(
        operation,
        resource.referentielId,
        collectivite.collectivitePreferences.referentiels
      );
    }

    // Prefer fail-closed for mutations when preferences are unknown.
    // Reads stay allowed (mode filter only applies to mutations).
    return !isReferentielMutationOperation(operation);
  }

  return true;
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

export function isUserAuditeurForAudit(
  user: UserRolesAndPermissions,
  auditId: number
): boolean {
  return user.collectivites.some((collectivite) =>
    collectivite.audits.some((audit) => audit.auditId === auditId)
  );
}

export function isUserAuditeur(user: CollectiviteRolesAndPermissions): boolean {
  return (
    hasCollectiviteRole(user, AuditRole.AUDITEUR) ||
    hasCollectiviteRole(user, AuditRole.AUDITEUR_AUDIT_NON_DEMARRE)
  );
}

export const UserPermissionRule = {
  hasPermission,
  hasRole,
};
