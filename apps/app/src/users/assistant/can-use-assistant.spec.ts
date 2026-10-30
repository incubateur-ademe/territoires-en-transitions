import {
  permissionsByRole,
  PlatformRole,
  UserRolesAndPermissions,
} from '@tet/domain/users';
import { describe, expect, test } from 'vitest';
import { canUseAssistant } from './can-use-assistant';

const withRoles = (roles: PlatformRole[]): UserRolesAndPermissions => ({
  roles,
  permissions: roles.flatMap((role) => permissionsByRole[role] ?? []),
  collectivites: [],
});

describe('canUseAssistant', () => {
  test('support, avec ou sans mode super admin', () => {
    expect(
      canUseAssistant(withRoles([PlatformRole.CONNECTED, PlatformRole.SUPPORT]))
    ).toBe(true);
    expect(
      canUseAssistant(
        withRoles([
          PlatformRole.CONNECTED,
          PlatformRole.SUPPORT,
          PlatformRole.SUPER_ADMIN,
        ])
      )
    ).toBe(true);
  });

  test('ni un utilisateur vérifié, ni un visiteur déconnecté', () => {
    expect(
      canUseAssistant(
        withRoles([PlatformRole.CONNECTED, PlatformRole.VERIFIED])
      )
    ).toBe(false);
    expect(canUseAssistant(null)).toBe(false);
  });
});
