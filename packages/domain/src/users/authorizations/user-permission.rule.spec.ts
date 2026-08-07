import { describe, expect, it } from 'vitest';
import {
  defaultCollectivitePreferences,
  type CollectivitePreferences,
} from '../../collectivites/collectivite-preferences.schema';
import { permissionsByRole } from './permission.models';
import {
  hasPermission,
  isReferentielOperationAllowed,
  isUserVisitor,
} from './user-permission.rules';
import { AuditRole, CollectiviteRole } from './user-role.enum.schema';
import { UserRolesAndPermissions } from './user-roles-and-permissions.schema';

const COLLECTIVITE_ID = 1;

const toUser = ({
  collectiviteRole,
  auditRoles,
  preferences = defaultCollectivitePreferences,
}: {
  collectiviteRole: CollectiviteRole | null;
  auditRoles: (AuditRole | null)[];
  preferences?: CollectivitePreferences;
}): UserRolesAndPermissions => ({
  roles: [],
  permissions: [],
  collectivites: [
    {
      collectiviteId: COLLECTIVITE_ID,
      role: collectiviteRole,
      permissions:
        collectiviteRole !== null
          ? [...permissionsByRole[collectiviteRole]]
          : [],
      collectiviteNom: 'Collectivite test',
      collectiviteType: 'test',
      collectiviteAccesRestreint: false,
      collectivitePreferences: preferences,
      audits: auditRoles.map((role, index) => ({
        auditId: index + 1,
        referentielId: 'te',
        role,
        permissions: role !== null ? [...permissionsByRole[role]] : [],
      })),
    },
  ],
});

describe('isUserVisitor', () => {
  it("considère visiteur l'auditeur d'un audit clos dont c'est le seul lien", () => {
    const user = toUser({ collectiviteRole: null, auditRoles: [null] });

    expect(isUserVisitor(user, { collectiviteId: COLLECTIVITE_ID })).toBe(true);
  });

  it("ne considère pas visiteur l'auditeur d'un audit encore en cours", () => {
    const user = toUser({
      collectiviteRole: null,
      auditRoles: [AuditRole.AUDITEUR],
    });

    expect(isUserVisitor(user, { collectiviteId: COLLECTIVITE_ID })).toBe(
      false
    );
  });

  it('ne considère pas visiteur un membre de la collectivité', () => {
    const user = toUser({
      collectiviteRole: CollectiviteRole.LECTURE,
      auditRoles: [],
    });

    expect(isUserVisitor(user, { collectiviteId: COLLECTIVITE_ID })).toBe(
      false
    );
  });
});

describe('hasPermission with referentielId', () => {
  const editionUser = (preferences: CollectivitePreferences) =>
    toUser({
      collectiviteRole: CollectiviteRole.EDITION,
      auditRoles: [],
      preferences,
    });

  it('autorise referentiels.mutate sur un référentiel en write', () => {
    const user = editionUser({
      referentiels: {
        ...defaultCollectivitePreferences.referentiels,
        te: { display: true, mode: 'write' },
      },
    });

    expect(
      hasPermission(user, 'referentiels.mutate', {
        collectiviteId: COLLECTIVITE_ID,
        referentielId: 'te',
      })
    ).toBe(true);
  });

  it('refuse referentiels.mutate sur un référentiel readonly', () => {
    const user = editionUser(defaultCollectivitePreferences);

    expect(
      hasPermission(user, 'referentiels.mutate', {
        collectiviteId: COLLECTIVITE_ID,
        referentielId: 'te',
      })
    ).toBe(false);
  });

  it('refuse referentiels.discussions.mutate sur un référentiel archived', () => {
    const user = editionUser({
      referentiels: {
        ...defaultCollectivitePreferences.referentiels,
        cae: { display: false, mode: 'archived' },
      },
    });

    expect(
      hasPermission(user, 'referentiels.discussions.mutate', {
        collectiviteId: COLLECTIVITE_ID,
        referentielId: 'cae',
      })
    ).toBe(false);
  });

  it('autorise referentiels.read sur un référentiel readonly', () => {
    const user = editionUser(defaultCollectivitePreferences);

    expect(
      hasPermission(user, 'referentiels.read', {
        collectiviteId: COLLECTIVITE_ID,
        referentielId: 'te',
      })
    ).toBe(true);
  });

  it('autorise referentiels.mutate sur te-test sans filtre mode', () => {
    const user = editionUser(defaultCollectivitePreferences);

    expect(
      hasPermission(user, 'referentiels.mutate', {
        collectiviteId: COLLECTIVITE_ID,
        referentielId: 'te-test',
      })
    ).toBe(true);
  });

  it('sans referentielId, ignore le mode (permission collectivité seule)', () => {
    const user = editionUser(defaultCollectivitePreferences);

    expect(
      hasPermission(user, 'referentiels.mutate', {
        collectiviteId: COLLECTIVITE_ID,
      })
    ).toBe(true);
  });

  it('refuse une mutation si la collectivité est absente du payload (fail-closed)', () => {
    const user: UserRolesAndPermissions = {
      roles: [],
      permissions: ['referentiels.mutate'],
      collectivites: [],
    };

    expect(
      hasPermission(user, 'referentiels.mutate', {
        collectiviteId: COLLECTIVITE_ID,
        referentielId: 'te',
      })
    ).toBe(false);
  });

  it('autorise une lecture si la collectivité est absente du payload', () => {
    const user: UserRolesAndPermissions = {
      roles: [],
      permissions: ['referentiels.read'],
      collectivites: [],
    };

    expect(
      hasPermission(user, 'referentiels.read', {
        collectiviteId: COLLECTIVITE_ID,
        referentielId: 'te',
      })
    ).toBe(true);
  });
});

describe('isReferentielOperationAllowedForMode', () => {
  it('bloque mutate en readonly', () => {
    expect(
      isReferentielOperationAllowed(
        'referentiels.mutate',
        'te',
        defaultCollectivitePreferences.referentiels
      )
    ).toBe(false);
  });

  it('autorise read en readonly', () => {
    expect(
      isReferentielOperationAllowed(
        'referentiels.read',
        'te',
        defaultCollectivitePreferences.referentiels
      )
    ).toBe(true);
  });
});
