import { defaultCollectivitePreferences } from '@tet/domain/collectivites';
import {
  AuditRole,
  CollectiviteRole,
  UserRolesAndPermissions,
} from '@tet/domain/users';
import { describe, expect, it } from 'vitest';
import { makeUserTdbUrl } from './make-user-tdb-url';

const COLLECTIVITE_ID = 4989;

const toUser = ({
  collectiviteRole,
  auditRoles = [],
}: {
  collectiviteRole: CollectiviteRole | null;
  auditRoles?: AuditRole[];
}): UserRolesAndPermissions => ({
  roles: [],
  permissions: [],
  collectivites: [
    {
      collectiviteId: COLLECTIVITE_ID,
      collectiviteNom: 'Collectivite test',
      collectiviteAccesRestreint: false,
      collectivitePreferences: defaultCollectivitePreferences,
      role: collectiviteRole,
      permissions: [],
      audits: auditRoles.map((role, index) => ({
        auditId: index + 1,
        referentielId: 'te' as const,
        role,
        permissions: [],
      })),
    },
  ],
});

describe('makeUserTdbUrl', () => {
  it('envoie un membre vers son suivi personnel', () => {
    expect(
      makeUserTdbUrl({
        user: toUser({ collectiviteRole: CollectiviteRole.LECTURE }),
        collectiviteId: COLLECTIVITE_ID,
      })
    ).toBe(`/collectivite/${COLLECTIVITE_ID}/tableau-de-bord/personnel`);
  });

  it('envoie vers la vue synthetique un auditeur rattaché par son seul audit', () => {
    expect(
      makeUserTdbUrl({
        user: toUser({
          collectiviteRole: null,
          auditRoles: [AuditRole.AUDITEUR],
        }),
        collectiviteId: COLLECTIVITE_ID,
      })
    ).toBe(`/collectivite/${COLLECTIVITE_ID}/tableau-de-bord/synthetique`);
  });

  it('envoie vers la vue synthetique un utilisateur sans lien avec la collectivité', () => {
    expect(
      makeUserTdbUrl({
        user: toUser({ collectiviteRole: CollectiviteRole.ADMIN }),
        collectiviteId: 1,
      })
    ).toBe('/collectivite/1/tableau-de-bord/synthetique');
  });
});
