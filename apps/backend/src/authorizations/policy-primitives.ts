import { PermissionOperation } from '@tet/domain/users';
import { AnyColumn, inArray, SQL, sql } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { isSystemScope, isUserScope, Scope, UserScope } from './scope';

export const policySentinelRefuse: SQL = sql`1 = 0`;

export function hasPlatformBypass({
  scope,
  permission,
}: {
  scope: Scope;
  permission: PermissionOperation;
}): boolean {
  if (isSystemScope(scope)) {
    return true;
  }
  return scope.permissions.permissions.includes(permission);
}

/**
 * Liste des ids de collectivités pour lesquelles le scope utilisateur détient
 * la permission, via rôle collectivité ou rôle d'audit rattaché.
 */
export function accessibleCollectiviteIds({
  scope,
  permission,
}: {
  scope: UserScope;
  permission: PermissionOperation;
}): number[] {
  return scope.permissions.collectivites
    .filter(
      (collectivite) =>
        collectivite.permissions.includes(permission) ||
        collectivite.audits.some((audit) =>
          audit.permissions.includes(permission)
        )
    )
    .map((collectivite) => collectivite.collectiviteId);
}

export function ownedByAccessibleCollectivite<
  Table extends PgTable & { collectiviteId: AnyColumn }
>({
  table,
  scope,
  permission,
}: {
  table: Table;
  scope: Scope;
  permission: PermissionOperation;
}): SQL {
  if (!isUserScope(scope)) {
    return policySentinelRefuse;
  }
  const ids = accessibleCollectiviteIds({ scope, permission });
  if (ids.length === 0) {
    return policySentinelRefuse;
  }
  return inArray(table.collectiviteId, ids);
}
