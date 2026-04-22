import { AccessPolicy, PolicyInput } from '@tet/backend/authorizations/access-policy';
import {
  hasPlatformBypass,
  ownedByAccessibleCollectivite,
} from '@tet/backend/authorizations/policy-primitives';
import { PermissionOperation } from '@tet/domain/users';
import { SQL } from 'drizzle-orm';
import { personneTagTable } from './personne-tag.table';

type PersonneTagTable = typeof personneTagTable;

function collectiviteScopedClause(
  permission: PermissionOperation
): (input: PolicyInput<PersonneTagTable>) => SQL | undefined {
  return ({ table, scope }) => {
    if (hasPlatformBypass({ scope, permission })) {
      return undefined;
    }
    return ownedByAccessibleCollectivite({ table, scope, permission });
  };
}

export const personneTagPolicy: AccessPolicy<PersonneTagTable> = {
  read: collectiviteScopedClause('collectivites.tags.read'),
  write: collectiviteScopedClause('collectivites.tags.mutate'),
};
