import {
  permissionsByRole,
  PlatformRole,
  UserRolesAndPermissions,
} from '@tet/domain/users';
import { describe, expect, it } from 'vitest';
import { listAllowedBackofficeTools } from './backoffice-tools';

const toUser = (roles: PlatformRole[]): UserRolesAndPermissions => ({
  roles,
  permissions: roles.flatMap((role) => permissionsByRole[role]),
  collectivites: [],
});

const toIds = (user: UserRolesAndPermissions | null) =>
  listAllowedBackofficeTools(user).map((tool) => tool.id);

describe('listAllowedBackofficeTools', () => {
  it('rend tous les outils au super admin', () => {
    expect(toIds(toUser([PlatformRole.SUPER_ADMIN]))).toEqual([
      'importer-plan',
      'ajouter-collectivite',
      'banniere',
      'reprise-tec',
    ]);
  });

  it('ne rend que la reprise T&C au rôle backoffice de la reprise', () => {
    expect(
      toIds(
        toUser([
          PlatformRole.VERIFIED,
          PlatformRole.BACKOFFICE_REPRISE_TEC_LECTURE,
        ])
      )
    ).toEqual(['reprise-tec']);
  });

  it("ne rend aucun outil à un compte qui n'en a aucun", () => {
    expect(toIds(toUser([PlatformRole.VERIFIED]))).toEqual([]);
  });

  it('ne rend aucun outil sans compte', () => {
    expect(toIds(null)).toEqual([]);
  });
});
