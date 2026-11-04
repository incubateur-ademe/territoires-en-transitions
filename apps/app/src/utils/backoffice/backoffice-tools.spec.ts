import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import {
  permissionsByRole,
  PlatformRole,
  UserRolesAndPermissions,
} from '@tet/domain/users';
import { describe, expect, it } from 'vitest';
import {
  isBackofficeToolAllowed,
  listAllowedBackofficeTools,
} from './backoffice-tools';

const toUser = (roles: PlatformRole[]): UserRolesAndPermissions => ({
  roles,
  permissions: roles.flatMap((role) => permissionsByRole[role]),
  collectivites: [],
});

const toIds = (
  user: UserRolesAndPermissions | null,
  collectivite: Parameters<typeof listAllowedBackofficeTools>[1] = null
) => listAllowedBackofficeTools(user, collectivite).map((tool) => tool.id);

const epci = {
  collectiviteId: 20,
  nom: 'CC du Test',
  collectiviteType: collectiviteTypeEnum.EPCI,
  isSimplifiedView: false,
};

const superAdmin = toUser([PlatformRole.SUPER_ADMIN]);

describe('listAllowedBackofficeTools', () => {
  it('rend tous les outils au super admin dans une collectivité', () => {
    expect(toIds(superAdmin, epci)).toEqual([
      'importer-plan',
      'ajouter-collectivite',
      'modifier-collectivite',
      'affichage-referentiels',
      'banniere',
      'actions-de-reference',
    ]);
  });

  it('mène les outils de collectivité vers la collectivité en cours', () => {
    const modifier = listAllowedBackofficeTools(superAdmin, epci).find(
      (tool) => tool.id === 'modifier-collectivite'
    );

    expect(modifier).toMatchObject({
      href: '/collectivite/20/modifier',
      scope: 'collectivite',
    });
  });

  it.each([
    ['sans collectivité', null],
    [
      'dans un service déconcentré',
      { ...epci, collectiviteType: collectiviteTypeEnum.DREAL },
    ],
    ['en vue simplifiée', { ...epci, isSimplifiedView: true }],
  ])("n'a pas d'outil de collectivité %s", (_, collectivite) => {
    expect(toIds(superAdmin, collectivite)).toEqual([
      'importer-plan',
      'ajouter-collectivite',
      'banniere',
    ]);
  });

  it("ne rend aucun outil à un compte qui n'en a aucun", () => {
    expect(toIds(toUser([PlatformRole.VERIFIED]))).toEqual([]);
  });

  it('ne rend aucun outil sans compte', () => {
    expect(toIds(null)).toEqual([]);
  });
});

describe('isBackofficeToolAllowed', () => {
  it("n'ouvre pas la bannière à un compte sans la permission", () => {
    expect(
      isBackofficeToolAllowed(toUser([PlatformRole.VERIFIED]), 'banniere')
    ).toBe(false);
  });

  it('ouvre la bannière au super admin', () => {
    expect(isBackofficeToolAllowed(superAdmin, 'banniere')).toBe(true);
  });

  it("n'ouvre aucun outil sans compte", () => {
    expect(isBackofficeToolAllowed(null, 'banniere')).toBe(false);
  });
});
