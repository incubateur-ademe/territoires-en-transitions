import {
  getAuthUser,
  getTestApp,
  getTestRouter,
  YOLO_DODO,
} from '@tet/backend/test';
import {
  AuthenticatedUser,
  AuthUser,
} from '@tet/backend/users/models/auth.models';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { UserRole } from '@tet/domain/users';
import { onTestFinished } from 'vitest';
import { ResourceType } from '../resource-type.enum';
import { RoleService } from '../roles/role.service';
import { UpdateUserRoleService } from './update-user-role.service';

describe('Authorizations router test', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let updateRoleService: UpdateUserRoleService;
  let roleService: RoleService;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser(YOLO_DODO);
    const app = await getTestApp();
    updateRoleService = app.get(UpdateUserRoleService);
    roleService = app.get(RoleService);
  });

  async function addSupportRoleToUser(userId: string) {
    updateRoleService.setIsSupport(userId, true);

    onTestFinished(async () => {
      await updateRoleService.setIsSupport(userId, false);
    });
  }

  async function expectUserToHaveRoleSupportEnabled(
    user: AuthUser,
    enabled = true
  ) {
    const userRolesInitial = await roleService.getUserRoles(
      user,
      ResourceType.PLATEFORME,
      null
    );
    expect(userRolesInitial.includes(UserRole.SUPPORT)).toBe(enabled);
  }

  test('Active le mode support pour un utilisateur avec le rôle support', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    await expectUserToHaveRoleSupportEnabled(yoloDodoUser, false);

    await addSupportRoleToUser(yoloDodoUser.id);

    const { user: userBefore } = await caller.users.getDetails();

    expect(userBefore.isSupport).toBe(true);
    expect(userBefore.isSupportModeEnabled).toBe(false);

    await expectUserToHaveRoleSupportEnabled(yoloDodoUser, false);

    await caller.users.authorizations.toggleSupportMode({
      isEnabled: true,
    });

    const { user: userAfter } = await caller.users.getDetails();

    expect(userAfter.isSupport).toBe(true);
    expect(userAfter.isSupportModeEnabled).toBe(true);

    await expectUserToHaveRoleSupportEnabled(yoloDodoUser, true);
  });

  test("Ne peut pas activer le mode support si l'utilisateur n'a pas le rôle support", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    await expectUserToHaveRoleSupportEnabled(yoloDodoUser, false);

    await expect(
      caller.users.authorizations.toggleSupportMode({
        isEnabled: true,
      })
    ).rejects.toThrowError(
      /L'utilisateur doit avoir le rôle support pour activer le mode support/
    );

    await expectUserToHaveRoleSupportEnabled(yoloDodoUser, false);
  });
});
