import { defaultCollectivitePreferences } from '@tet/domain/collectivites';
import {
  AuditRole,
  CollectiviteRole,
  CollectiviteRolesAndPermissions,
  permissionsByRole,
  PlatformRole,
  UserRolesAndPermissions,
} from '@tet/domain/users';
import { describe, expect, it } from 'vitest';
import { toUserCollectivites } from './panierAPI';

const toCollectiviteRolesAndPermissions = ({
  role,
  audits = [],
}: {
  role: CollectiviteRole | null;
  audits?: CollectiviteRolesAndPermissions['audits'];
}): CollectiviteRolesAndPermissions => ({
  role,
  permissions: role ? permissionsByRole[role] : [],
  collectiviteId: 1,
  collectiviteNom: 'Collectivité test',
  collectiviteType: 'epci',
  collectiviteAccesRestreint: false,
  collectivitePreferences: defaultCollectivitePreferences,
  audits,
});

const toUserRolesAndPermissions = ({
  platformRoles = [],
  collectivite,
}: {
  platformRoles?: PlatformRole[];
  collectivite: CollectiviteRolesAndPermissions;
}): UserRolesAndPermissions => ({
  roles: platformRoles,
  permissions: platformRoles.flatMap(
    (platformRole) => permissionsByRole[platformRole]
  ),
  collectivites: [collectivite],
});

describe('toUserCollectivites', (): void => {
  it.each([CollectiviteRole.EDITION, CollectiviteRole.ADMIN])(
    'autorise la création de plan au rôle %s',
    (role): void => {
      expect(
        toUserCollectivites(
          toUserRolesAndPermissions({
            collectivite: toCollectiviteRolesAndPermissions({ role }),
          })
        )
      ).toEqual([
        {
          collectiviteId: 1,
          collectiviteNom: 'Collectivité test',
          canCreatePlan: true,
        },
      ]);
    }
  );

  it.each([
    CollectiviteRole.LECTURE,
    CollectiviteRole.EDITION_FICHES_INDICATEURS,
  ])('refuse la création de plan au rôle %s', (role): void => {
    expect(
      toUserCollectivites(
        toUserRolesAndPermissions({
          collectivite: toCollectiviteRolesAndPermissions({ role }),
        })
      )
    ).toEqual([
      {
        collectiviteId: 1,
        collectiviteNom: 'Collectivité test',
        canCreatePlan: false,
      },
    ]);
  });

  it("refuse la création de plan à l'auditeur sans rôle dans la collectivité", (): void => {
    expect(
      toUserCollectivites(
        toUserRolesAndPermissions({
          collectivite: toCollectiviteRolesAndPermissions({
            role: null,
            audits: [
              {
                role: AuditRole.AUDITEUR,
                permissions: permissionsByRole[AuditRole.AUDITEUR],
                auditId: 1,
                referentielId: 'cae',
              },
            ],
          }),
        })
      )
    ).toEqual([
      {
        collectiviteId: 1,
        collectiviteNom: 'Collectivité test',
        canCreatePlan: false,
      },
    ]);
  });

  it('autorise la création de plan au super-admin rattaché en lecture, comme le checkout', (): void => {
    expect(
      toUserCollectivites(
        toUserRolesAndPermissions({
          platformRoles: [PlatformRole.SUPER_ADMIN],
          collectivite: toCollectiviteRolesAndPermissions({
            role: CollectiviteRole.LECTURE,
          }),
        })
      )
    ).toEqual([
      {
        collectiviteId: 1,
        collectiviteNom: 'Collectivité test',
        canCreatePlan: true,
      },
    ]);
  });
});
