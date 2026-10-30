import { profilAssistantPath } from '@/app/app/paths';
import {
  permissionsByRole,
  PlatformRole,
  UserWithRolesAndPermissions,
} from '@tet/domain/users';
import { isNavDropdown, NavItem } from '@tet/ui';
import { describe, expect, test, vi } from 'vitest';
import { makeSecondaryNav } from './make-secondary-nav';

const toUser = (roles: PlatformRole[]): UserWithRolesAndPermissions => ({
  id: 'utilisateur-connecte',
  nom: 'Test',
  prenom: 'Camille',
  email: 'camille@test.fr',
  telephone: null,
  cguAccepteesLe: null,
  newEmail: null,
  roles,
  permissions: roles.flatMap((role) => permissionsByRole[role] ?? []),
  collectivites: [],
});

const userMenuDataTests = (roles: PlatformRole[]) =>
  (
    makeSecondaryNav({
      user: toUser(roles),
      currentCollectivite: null,
      onLogout: vi.fn(),
    }) as NavItem[]
  )
    .filter(isNavDropdown)
    .find((item) => item.dataTest === 'nav-user')
    ?.links.map((link) => [link.dataTest, link.href]);

describe('makeSecondaryNav — menu utilisateur', () => {
  test("un compte support voit l'assistant entre Préférences et Se déconnecter", () => {
    expect(
      userMenuDataTests([PlatformRole.CONNECTED, PlatformRole.SUPPORT])
    ).toEqual([
      ['user-profile', '/profil'],
      ['user-assistant', profilAssistantPath],
      ['user-logout', '/'],
    ]);
  });

  test("un utilisateur vérifié ne voit pas l'assistant", () => {
    expect(
      userMenuDataTests([PlatformRole.CONNECTED, PlatformRole.VERIFIED])
    ).toEqual([
      ['user-profile', '/profil'],
      ['user-logout', '/'],
    ]);
  });
});
