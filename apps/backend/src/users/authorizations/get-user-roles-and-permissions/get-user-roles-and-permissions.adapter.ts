import {
  AuditRole,
  CollectiviteRole,
  PermissionOperation,
  permissionsByRole,
  PlatformRole,
  UserRolesAndPermissions,
  userRolesAndPermissionsSchema,
} from '@tet/domain/users';
import {
  AuditRolesRow,
  CollectiviteRolesRow,
  PlatformRolesRow,
} from './get-user-roles-and-permissions.repository';

function buildUniquePermissionsSet(
  roles: (PlatformRole | CollectiviteRole | AuditRole)[]
): PermissionOperation[] {
  return [
    ...new Set<PermissionOperation>(
      roles.flatMap((role) => permissionsByRole[role] ?? [])
    ),
  ];
}

export function toUserRolesAndPermissions({
  platformRolesRow,
  collectiviteRolesRows,
  auditRolesRows,
}: {
  platformRolesRow: PlatformRolesRow;
  collectiviteRolesRows: CollectiviteRolesRow[];
  auditRolesRows: AuditRolesRow[];
}): UserRolesAndPermissions {
  const platformRoles = [
    PlatformRole.CONNECTE,

    ...(platformRolesRow.isVerified ? [PlatformRole.VERIFIE] : []),
    ...(platformRolesRow.isSupport ? [PlatformRole.SUPPORT] : []),
    ...(platformRolesRow.isSupportModeEnabled
      ? [PlatformRole.SUPPORT_MODE_ENABLED]
      : []),
    ...(platformRolesRow.isAdeme ? [PlatformRole.ADEME] : []),
  ];

  const collectiviteRoles = collectiviteRolesRows.map(
    ({ role, ...collectivite }) => ({
      ...collectivite,
      roles: [role],
      permissions: buildUniquePermissionsSet([role]),
    })
  );

  const auditRoles = auditRolesRows.map(({ auditId, collectiviteId }) => ({
    auditId,
    collectiviteId,
    roles: [AuditRole.AUDITEUR],
    permissions: buildUniquePermissionsSet([AuditRole.AUDITEUR]),
  }));

  const userPermissions = {
    roles: platformRoles,
    permissions: buildUniquePermissionsSet(platformRoles),

    collectivites: collectiviteRoles,
    audits: auditRoles,
  };

  return userRolesAndPermissionsSchema.parse(userPermissions);
}
