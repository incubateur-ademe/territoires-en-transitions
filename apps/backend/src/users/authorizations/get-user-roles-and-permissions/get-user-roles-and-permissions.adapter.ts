import {
  AuditRole,
  AuditRolesAndPermissions,
  CollectiviteRole,
  CollectiviteRolesAndPermissions,
  PermissionOperation,
  permissionsByRole,
  PlatformRole,
  UserRolesAndPermissions,
  userRolesAndPermissionsSchema,
} from '@tet/domain/users';
import { groupBy } from 'es-toolkit';
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

function toAuditRolesAndPermissions(
  audit: AuditRolesRow
): AuditRolesAndPermissions {
  return {
    auditId: audit.auditId,
    role: AuditRole.AUDITEUR,
    permissions: buildUniquePermissionsSet([AuditRole.AUDITEUR]),
  };
}

function toCollectiviteRolesAndPermissions(
  collectiviteRows: CollectiviteRolesRow[],
  auditRows: AuditRolesRow[]
): CollectiviteRolesAndPermissions[] {
  // Group audits by collectiviteId
  const auditsByCollectiviteId = groupBy(
    auditRows,
    (audit) => audit.collectiviteId
  );

  // Create a set of collectiviteIds for quick lookup
  const collectiviteIds = new Set(
    collectiviteRows.map((collectivite) => collectivite.collectiviteId)
  );

  // Process collectivites that exist in collectiviteRoles
  const collectivites = collectiviteRows.map((collectivite) => {
    const audits = auditsByCollectiviteId[collectivite.collectiviteId] ?? [];
    return {
      ...collectivite,
      permissions: buildUniquePermissionsSet([collectivite.role]),
      audits: audits.map(toAuditRolesAndPermissions),
    };
  });

  // Process audits whose collectiviteId doesn't exist in collectiviteRoles
  const collectivitesFromAuditsOnly = Object.entries(auditsByCollectiviteId)
    .filter(([collectiviteId]) => !collectiviteIds.has(Number(collectiviteId)))
    .map(([, audits]) => {
      // Use the first audit's collectivite info (they all have the same collectiviteId)
      const [audit] = audits;
      return {
        collectiviteId: audit.collectiviteId,
        collectiviteNom: audit.collectiviteNom,
        collectiviteAccesRestreint: audit.collectiviteAccesRestreint,
        role: null,
        permissions: [],
        audits: audits.map(toAuditRolesAndPermissions),
      };
    });

  return [...collectivites, ...collectivitesFromAuditsOnly];
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
  const optionalPlatformRoles = [
    [platformRolesRow.isVerified, PlatformRole.VERIFIED],
    [platformRolesRow.isSupport, PlatformRole.SUPPORT],
    [platformRolesRow.isSuperAdminRoleEnabled, PlatformRole.SUPER_ADMIN],
    [platformRolesRow.isAdeme, PlatformRole.ADEME],
  ] satisfies Array<[boolean, PlatformRole]>;

  const platformRoles = [
    PlatformRole.CONNECTED,

    ...optionalPlatformRoles
      .filter(([isEnabled]) => isEnabled)
      .map(([, role]) => role),
  ];

  const userPermissions: UserRolesAndPermissions = {
    roles: platformRoles,
    permissions: buildUniquePermissionsSet(platformRoles),

    collectivites: toCollectiviteRolesAndPermissions(
      collectiviteRolesRows,
      auditRolesRows
    ),
  };

  return userRolesAndPermissionsSchema.parse(userPermissions);
}
