import { INestApplication } from '@nestjs/common';
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
import { addUserRoleSupport } from '../../users/users.test-fixture';
import { ResourceType } from '../resource-type.enum';
import { RoleService } from '../roles/role.service';

describe('UpdateUserRole', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let roleService: RoleService;
  let app: INestApplication;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser(YOLO_DODO);
    app = await getTestApp();
    roleService = app.get(RoleService);
  });

  describe('Rôle Support', () => {
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

      const { cleanup } = await addUserRoleSupport({
        app,
        userId: yoloDodoUser.id,
      });

      onTestFinished(cleanup);

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

      onTestFinished(async () => {
        await caller.users.authorizations.toggleSupportMode({
          isEnabled: false,
        });
      });
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
});
