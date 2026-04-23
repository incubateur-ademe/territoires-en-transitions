import { AccessPolicy, PolicyInput } from '@tet/backend/authorizations/access-policy';
import {
  accessibleCollectiviteIds,
  hasPlatformBypass,
  policySentinelRefuse,
} from '@tet/backend/authorizations/policy-primitives';
import { isUserScope } from '@tet/backend/authorizations/scope';
import { ficheActionSharingTable } from '@tet/backend/plans/fiches/share-fiches/fiche-action-sharing.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { PermissionOperation } from '@tet/domain/users';
import { inArray, or, SQL, sql } from 'drizzle-orm';

type FicheActionTable = typeof ficheActionTable;

function ownedOrSharedWithAccessibleCollectivite(
  permission: PermissionOperation
): (input: PolicyInput<FicheActionTable>) => SQL | undefined {
  return ({ table, scope }) => {
    if (hasPlatformBypass({ scope, permission })) {
      return undefined;
    }
    if (!isUserScope(scope)) {
      return policySentinelRefuse;
    }
    const accessibleIds = accessibleCollectiviteIds({ scope, permission });
    if (accessibleIds.length === 0) {
      return policySentinelRefuse;
    }
    const idList = sql.join(
      accessibleIds.map((id) => sql`${id}`),
      sql`, `
    );
    return or(
      inArray(table.collectiviteId, accessibleIds),
      sql`${table.id} IN (SELECT ${ficheActionSharingTable.ficheId} FROM ${ficheActionSharingTable} WHERE ${ficheActionSharingTable.collectiviteId} IN (${idList}))`
    );
  };
}

export const ficheActionPolicy: AccessPolicy<FicheActionTable> = {
  read: ownedOrSharedWithAccessibleCollectivite('plans.fiches.read'),
  write: ownedOrSharedWithAccessibleCollectivite('plans.fiches.update'),
};
