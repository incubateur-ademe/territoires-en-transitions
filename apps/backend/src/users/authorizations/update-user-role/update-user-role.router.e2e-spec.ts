import { INestApplication } from '@nestjs/common';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { PlatformRole } from '@tet/domain/users';
import { addUserRoleSupport } from '../../users/users.test-fixture';

describe('UpdateUserRole', () => {
  let router: TrpcRouter;
  let testUser: AuthenticatedUser;
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const testUserResult = await addTestUser(databaseService);
    testUser = getAuthUserFromUserCredentials(testUserResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Rôle Support', () => {
    async function expectUserToHaveRoleSupportEnabled(
      caller: ReturnType<typeof router.createCaller>,
      enabled = true
    ) {
      const user = await caller.users.users.get();
      expect(user.roles.includes(PlatformRole.SUPER_ADMIN)).toBe(enabled);
    }

    test('Active le mode super-admin pour un utilisateur avec le rôle support', async () => {
      const caller = router.createCaller({ user: testUser });

      await expectUserToHaveRoleSupportEnabled(caller, false);

      const { cleanup } = await addUserRoleSupport({
        databaseService,
        userId: testUser.id,
      });

      onTestFinished(cleanup);

      const userBefore = await caller.users.users.get();

      expect(userBefore.roles).toContain(PlatformRole.SUPPORT);
      expect(userBefore.roles).not.toContain(PlatformRole.SUPER_ADMIN);

      await expectUserToHaveRoleSupportEnabled(caller, false);

      await caller.users.authorizations.toggleSuperAdminRole({
        isEnabled: true,
      });

      const userAfter = await caller.users.users.get();

      expect(userAfter.roles).toContain(PlatformRole.SUPPORT);
      expect(userAfter.roles).toContain(PlatformRole.SUPER_ADMIN);

      await expectUserToHaveRoleSupportEnabled(caller, true);

      onTestFinished(async () => {
        await caller.users.authorizations.toggleSuperAdminRole({
          isEnabled: false,
        });
      });
    });

    test("Ne peut pas activer le mode super-admin si l'utilisateur n'a pas le rôle support", async () => {
      const caller = router.createCaller({ user: testUser });

      await expectUserToHaveRoleSupportEnabled(caller, false);

      await expect(
        caller.users.authorizations.toggleSuperAdminRole({
          isEnabled: true,
        })
      ).rejects.toThrowError(
        /L'utilisateur doit avoir le rôle support pour activer le mode super-admin/
      );

      await expectUserToHaveRoleSupportEnabled(caller, false);
    });
  });
});
