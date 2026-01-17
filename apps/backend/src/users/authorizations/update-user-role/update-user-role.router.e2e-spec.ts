import { INestApplication } from '@nestjs/common';
import {
  getAuthUser,
  getTestApp,
  getTestRouter,
  YOLO_DODO,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { PlatformRole } from '@tet/domain/users';
import { addUserRoleSupport } from '../../users/users.test-fixture';

describe('UpdateUserRole', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let app: INestApplication;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser(YOLO_DODO);
    app = await getTestApp();
  });

  describe('Rôle Support', () => {
    async function expectUserToHaveRoleSupportEnabled(
      caller: ReturnType<typeof router.createCaller>,
      enabled = true
    ) {
      const user = await caller.users.users.get();
      expect(user.roles.includes(PlatformRole.SUPPORT_MODE_ENABLED)).toBe(
        enabled
      );
    }

    test('Active le mode support pour un utilisateur avec le rôle support', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      await expectUserToHaveRoleSupportEnabled(caller, false);

      const { cleanup } = await addUserRoleSupport({
        app,
        userId: yoloDodoUser.id,
      });

      onTestFinished(cleanup);

      const userBefore = await caller.users.users.get();

      expect(userBefore.roles).toContain(PlatformRole.SUPPORT);
      expect(userBefore.roles).not.toContain(PlatformRole.SUPPORT_MODE_ENABLED);

      await expectUserToHaveRoleSupportEnabled(caller, false);

      await caller.users.authorizations.toggleSupportMode({
        isEnabled: true,
      });

      const userAfter = await caller.users.users.get();

      expect(userAfter.roles).toContain(PlatformRole.SUPPORT);
      expect(userAfter.roles).toContain(PlatformRole.SUPPORT_MODE_ENABLED);

      await expectUserToHaveRoleSupportEnabled(caller, true);

      onTestFinished(async () => {
        await caller.users.authorizations.toggleSupportMode({
          isEnabled: false,
        });
      });
    });

    test("Ne peut pas activer le mode support si l'utilisateur n'a pas le rôle support", async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      await expectUserToHaveRoleSupportEnabled(caller, false);

      await expect(
        caller.users.authorizations.toggleSupportMode({
          isEnabled: true,
        })
      ).rejects.toThrowError(
        /L'utilisateur doit avoir le rôle support pour activer le mode support/
      );

      await expectUserToHaveRoleSupportEnabled(caller, false);
    });
  });
});
