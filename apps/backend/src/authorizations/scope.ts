import {
  hasPermission,
  PermissionOperation,
  UserRolesAndPermissions,
} from '@tet/domain/users';

export type UserScope = {
  kind: 'user';
  userId: string;
  permissions: UserRolesAndPermissions;
};

export type SystemScope = {
  kind: 'system';
  reason: string;
};

export type Scope = UserScope | SystemScope;

export function isUserScope(scope: Scope): scope is UserScope {
  return scope.kind === 'user';
}

export function isSystemScope(scope: Scope): scope is SystemScope {
  return scope.kind === 'system';
}

export function systemScope(reason: string): SystemScope {
  return { kind: 'system', reason };
}

export function scopeHasPermission({
  scope,
  operation,
  resource = {},
}: {
  scope: Scope;
  operation: PermissionOperation;
  resource?: { collectiviteId?: number; auditId?: number };
}): boolean {
  if (isSystemScope(scope)) {
    return true;
  }
  return hasPermission(scope.permissions, operation, resource);
}
