import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
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
import {
  hasPlatformBypass,
  ownedByAccessibleCollectivite,
} from './policy-primitives';
import { Scope, systemScope, UserScope } from './scope';

const pgDialect = new PgDialect();

const PERMISSION: PermissionOperation = 'collectivites.tags.mutate';

function makeUserScope(
  partialPermissions: Partial<UserRolesAndPermissions>
): UserScope {
  return {
    kind: 'user',
    userId: 'user-id',
    permissions: {
      roles: [PlatformRole.CONNECTED],
      permissions: [],
      collectivites: [],
      ...partialPermissions,
    },
  };
}

function toSqlString(clause: SQL): { sql: string; params: unknown[] } {
  const { sql, params } = pgDialect.sqlToQuery(clause);
  return { sql, params };
}

describe('hasPlatformBypass', () => {
  it('true pour un scope système', () => {
    const scope: Scope = systemScope('test');
    expect(hasPlatformBypass({ scope, permission: PERMISSION })).toBe(true);
  });

  it('true si la permission est détenue au niveau plateforme', () => {
    const scope = makeUserScope({
      roles: [PlatformRole.SUPER_ADMIN],
      permissions: [PERMISSION],
    });
    expect(hasPlatformBypass({ scope, permission: PERMISSION })).toBe(true);
  });

  it("false si la permission n'est pas plateforme", () => {
    const scope = makeUserScope({
      roles: [PlatformRole.VERIFIED],
      permissions: [],
    });
    expect(hasPlatformBypass({ scope, permission: PERMISSION })).toBe(false);
  });
});

describe('ownedByAccessibleCollectivite', () => {
  it('retourne la sentinelle de refus pour un scope système', () => {
    const scope = systemScope('job');
    const sqlClause = ownedByAccessibleCollectivite({
      table: personneTagTable,
      scope,
      permission: PERMISSION,
    });
    expect(toSqlString(sqlClause).sql).toBe('1 = 0');
  });

  it('retourne la sentinelle de refus si l\'utilisateur n\'a aucune collectivité', () => {
    const scope = makeUserScope({ collectivites: [] });
    const sqlClause = ownedByAccessibleCollectivite({
      table: personneTagTable,
      scope,
      permission: PERMISSION,
    });
    expect(toSqlString(sqlClause).sql).toBe('1 = 0');
  });

  it('filtre sur les collectivités où le rôle porte la permission', () => {
    const scope = makeUserScope({
      collectivites: [
        makeCollectivite({
          collectiviteId: 1,
          role: CollectiviteRole.ADMIN,
          permissions: [PERMISSION],
        }),
        makeCollectivite({
          collectiviteId: 7,
          role: CollectiviteRole.EDITION,
          permissions: [PERMISSION],
        }),
        makeCollectivite({
          collectiviteId: 42,
          role: CollectiviteRole.LECTURE,
          permissions: [],
        }),
      ],
    });
    const sqlClause = ownedByAccessibleCollectivite({
      table: personneTagTable,
      scope,
      permission: PERMISSION,
    });
    const { sql, params } = toSqlString(sqlClause);
    expect(sql).toBe('"personne_tag"."collectivite_id" in ($1, $2)');
    expect(params).toEqual([1, 7]);
  });

  it('inclut les collectivités où la permission vient d\'un rôle d\'audit', () => {
    const scope = makeUserScope({
      collectivites: [
        makeCollectivite({
          collectiviteId: 3,
          role: null,
          permissions: [],
          audits: [
            {
              auditId: 10,
              role: null,
              permissions: [PERMISSION],
            },
          ],
        }),
      ],
    });
    const sqlClause = ownedByAccessibleCollectivite({
      table: personneTagTable,
      scope,
      permission: PERMISSION,
    });
    const { params } = toSqlString(sqlClause);
    expect(params).toEqual([3]);
  });
});

function makeCollectivite(args: {
  collectiviteId: number;
  role: CollectiviteRole | null;
  permissions: PermissionOperation[];
  audits?: UserRolesAndPermissions['collectivites'][number]['audits'];
}): UserRolesAndPermissions['collectivites'][number] {
  return {
    collectiviteId: args.collectiviteId,
    collectiviteNom: `col-${args.collectiviteId}`,
    collectiviteAccesRestreint: false,
    collectivitePreferences: defaultCollectivitePreferences,
    role: args.role,
    permissions: args.permissions,
    audits: args.audits ?? [],
  };
}
