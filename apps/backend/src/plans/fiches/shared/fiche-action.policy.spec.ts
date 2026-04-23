import {
  Scope,
  systemScope,
  UserScope,
} from '@tet/backend/authorizations/scope';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
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
import { ficheActionPolicy } from './fiche-action.policy';

const pgDialect = new PgDialect();

function toQuery(clause: SQL | undefined): { sql: string; params: unknown[] } | undefined {
  if (clause === undefined) {
    return undefined;
  }
  const q = pgDialect.sqlToQuery(clause);
  return { sql: q.sql, params: q.params };
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
    role: CollectiviteRole.LECTURE,
    permissions: args.permissions,
    audits: [],
  };
}

describe('ficheActionPolicy.read', () => {
  it('bypass pour un scope système', () => {
    const scope: Scope = systemScope('worker');
    expect(
      ficheActionPolicy.read({ table: ficheActionTable, scope })
    ).toBeUndefined();
  });

  it('bypass pour un SUPER_ADMIN (plans.fiches.read plateforme)', () => {
    const scope = makeUserScope({
      roles: [PlatformRole.SUPER_ADMIN],
      permissions: ['plans.fiches.read'],
    });
    expect(
      ficheActionPolicy.read({ table: ficheActionTable, scope })
    ).toBeUndefined();
  });

  it("refuse (1=0) si l'utilisateur n'a aucune collectivité lisible", () => {
    const scope = makeUserScope({
      collectivites: [
        makeCollectivite({ collectiviteId: 1, permissions: [] }),
      ],
    });
    expect(
      toQuery(ficheActionPolicy.read({ table: ficheActionTable, scope }))?.sql
    ).toBe('1 = 0');
  });

  it('filtre sur owner OR shared-with pour un utilisateur avec fiches.read sur col. 1 et 7', () => {
    const scope = makeUserScope({
      collectivites: [
        makeCollectivite({
          collectiviteId: 1,
          permissions: ['plans.fiches.read'],
        }),
        makeCollectivite({
          collectiviteId: 7,
          permissions: ['plans.fiches.read'],
        }),
      ],
    });
    const q = toQuery(
      ficheActionPolicy.read({ table: ficheActionTable, scope })
    );
    expect(q).toBeDefined();
    expect(q?.sql).toMatchInlineSnapshot(`"("fiche_action"."collectivite_id" in ($1, $2) or "fiche_action"."id" IN (SELECT "fiche_action_sharing"."fiche_id" FROM "fiche_action_sharing" WHERE "fiche_action_sharing"."collectivite_id" IN ($3, $4)))"`);
    expect(q?.params).toEqual([1, 7, 1, 7]);
  });
});

describe('ficheActionPolicy.write', () => {
  it('bypass pour un scope système', () => {
    expect(
      ficheActionPolicy.write({
        table: ficheActionTable,
        scope: systemScope('fixture'),
      })
    ).toBeUndefined();
  });

  it('filtre sur plans.fiches.update pour un utilisateur EDITION', () => {
    const scope = makeUserScope({
      collectivites: [
        makeCollectivite({
          collectiviteId: 42,
          permissions: ['plans.fiches.update'],
        }),
      ],
    });
    const q = toQuery(
      ficheActionPolicy.write({ table: ficheActionTable, scope })
    );
    expect(q?.params).toEqual([42, 42]);
  });

  it('refuse si collectivité avec plans.fiches.read seulement (pas update)', () => {
    const scope = makeUserScope({
      collectivites: [
        makeCollectivite({
          collectiviteId: 1,
          permissions: ['plans.fiches.read'],
        }),
      ],
    });
    expect(
      toQuery(ficheActionPolicy.write({ table: ficheActionTable, scope }))?.sql
    ).toBe('1 = 0');
  });
});
