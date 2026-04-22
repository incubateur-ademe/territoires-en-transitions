import { Scope, systemScope, UserScope } from '@tet/backend/authorizations/scope';
import { defaultCollectivitePreferences } from '@tet/domain/collectivites';
import {
  CollectiviteRole,
  PermissionOperation,
  PlatformRole,
  UserRolesAndPermissions,
} from '@tet/domain/users';
import { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import { personneTagPolicy } from './personne-tag.policy';
import { personneTagTable } from './personne-tag.table';

const pgDialect = new PgDialect();

function toQuery(clause: SQL | undefined): string | undefined {
  if (clause === undefined) {
    return undefined;
  }
  return pgDialect.sqlToQuery(clause).sql;
}

function makeUserScope(
  overrides: Partial<UserRolesAndPermissions>
): UserScope {
  return {
    kind: 'user',
    userId: 'test-user',
    permissions: {
      roles: [PlatformRole.CONNECTED],
      permissions: [],
      collectivites: [],
      ...overrides,
    },
  };
}

function makeCollectivite(args: {
  collectiviteId: number;
  permissions: PermissionOperation[];
}): UserRolesAndPermissions['collectivites'][number] {
  return {
    collectiviteId: args.collectiviteId,
    collectiviteNom: `col-${args.collectiviteId}`,
    collectiviteAccesRestreint: false,
    collectivitePreferences: defaultCollectivitePreferences,
    role: CollectiviteRole.EDITION,
    permissions: args.permissions,
    audits: [],
  };
}

describe('personneTagPolicy.read', () => {
  it('bypass pour un scope système', () => {
    const scope: Scope = systemScope('test');
    expect(
      personneTagPolicy.read({ table: personneTagTable, scope })
    ).toBeUndefined();
  });

  it('bypass pour un utilisateur VERIFIED (tags.read est plateforme)', () => {
    const scope = makeUserScope({
      roles: [PlatformRole.VERIFIED],
      permissions: ['collectivites.tags.read'],
    });
    expect(
      personneTagPolicy.read({ table: personneTagTable, scope })
    ).toBeUndefined();
  });

  it("refuse si l'utilisateur n'a pas tags.read", () => {
    const scope = makeUserScope({ permissions: [], collectivites: [] });
    expect(
      toQuery(personneTagPolicy.read({ table: personneTagTable, scope }))
    ).toBe('1 = 0');
  });
});

describe('personneTagPolicy.write', () => {
  it('bypass pour un scope système', () => {
    expect(
      personneTagPolicy.write({
        table: personneTagTable,
        scope: systemScope('tag migration'),
      })
    ).toBeUndefined();
  });

  it('bypass pour un SUPER_ADMIN (tags.mutate plateforme)', () => {
    const scope = makeUserScope({
      roles: [PlatformRole.SUPER_ADMIN],
      permissions: ['collectivites.tags.mutate'],
    });
    expect(
      personneTagPolicy.write({ table: personneTagTable, scope })
    ).toBeUndefined();
  });

  it('filtre sur les collectivités avec tags.mutate pour un utilisateur EDITION', () => {
    const scope = makeUserScope({
      collectivites: [
        makeCollectivite({
          collectiviteId: 1,
          permissions: ['collectivites.tags.mutate'],
        }),
        makeCollectivite({
          collectiviteId: 2,
          permissions: ['collectivites.tags.mutate'],
        }),
      ],
    });
    expect(
      toQuery(personneTagPolicy.write({ table: personneTagTable, scope }))
    ).toBe('"personne_tag"."collectivite_id" in ($1, $2)');
  });

  it('refuse (1=0) pour un utilisateur sans collectivité mutable', () => {
    const scope = makeUserScope({
      collectivites: [
        makeCollectivite({ collectiviteId: 5, permissions: [] }),
      ],
    });
    expect(
      toQuery(personneTagPolicy.write({ table: personneTagTable, scope }))
    ).toBe('1 = 0');
  });
});
