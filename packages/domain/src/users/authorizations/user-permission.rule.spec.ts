import { describe, expect, it } from 'vitest';
import { defaultCollectivitePreferences } from '../../collectivites/collectivite-preferences.schema';
import { isUserVisitor } from './user-permission.rules';
import { AuditRole, CollectiviteRole } from './user-role.enum.schema';
import { UserRolesAndPermissions } from './user-roles-and-permissions.schema';

const COLLECTIVITE_ID = 1;

const toUser = ({
  collectiviteRole,
  auditRoles,
}: {
  collectiviteRole: CollectiviteRole | null;
  auditRoles: (AuditRole | null)[];
}): UserRolesAndPermissions => ({
  roles: [],
  permissions: [],
  collectivites: [
    {
      collectiviteId: COLLECTIVITE_ID,
      role: collectiviteRole,
      permissions: [],
      collectiviteNom: 'Collectivite test',
      collectiviteAccesRestreint: false,
      collectivitePreferences: defaultCollectivitePreferences,
      audits: auditRoles.map((role, index) => ({
        auditId: index + 1,
        role,
        permissions: [],
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
