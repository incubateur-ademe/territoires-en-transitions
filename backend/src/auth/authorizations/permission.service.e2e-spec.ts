import { dcpTable } from '@/backend/auth';
import { PermissionOperation } from '@/backend/auth/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { ResourceType } from '@/backend/auth/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@/backend/auth/models/auth.models';
import { collectiviteTable } from '@/backend/collectivites';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  YOULOU_DOUDOU,
} from '@/backend/test';
import { DatabaseService } from '@/backend/utils';
import { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { RoleUpdateService } from '@/backend/auth/authorizations/roles/role-update.service';

describe('Gestion des droits', () => {
  let app: INestApplication;
  let permissionService: PermissionService;
  let yoloDodoUser: AuthenticatedUser;
  let youlouDoudouUser: AuthenticatedUser;
  let databaseService: DatabaseService;
  let roleUpdateService : RoleUpdateService;

  beforeAll(async () => {
    app = await getTestApp();
    permissionService = app.get(PermissionService);
    roleUpdateService  = app.get(RoleUpdateService);
    yoloDodoUser = await getAuthUser();
    youlouDoudouUser = await getAuthUser(YOULOU_DOUDOU);
    databaseService = await getTestDatabase(app);
  });

  describe('Droit en visite sur une collectivité -> NOK', async () => {
    test('Utilisateur vérifié -> OK', async () => {
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperation.COLLECTIVITES_VISITE,
          ResourceType.COLLECTIVITE,
          20,
          true
        )
      ).toBeTruthy;
    });
    test('Utilisateur non vérifié -> NOK', async () => {
      await roleUpdateService.setIsVerified(yoloDodoUser.id, false);
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperation.COLLECTIVITES_VISITE,
          ResourceType.COLLECTIVITE,
          20,
          true
        )
      ).toBeFalsy;

      onTestFinished(async () => {
        try {
          await roleUpdateService.setIsVerified(yoloDodoUser.id, true)
        } catch (error) {
          console.error('Erreur lors de la remise à zéro des données.', error);
        }
      });
    });
    test('Collectivité en accès restreint -> NOK', async () => {
      await databaseService.db
        .update(collectiviteTable)
        .set({ accessRestreint: true })
        .where(eq(collectiviteTable.id, 20));
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperation.COLLECTIVITES_VISITE,
          ResourceType.COLLECTIVITE,
          20,
          true
        )
      ).toBeFalsy;

      onTestFinished(async () => {
        try {
          await databaseService.db
            .update(collectiviteTable)
            .set({ accessRestreint: false })
            .where(eq(collectiviteTable.id, 20));
        } catch (error) {
          console.error('Erreur lors de la remise à zéro des données.', error);
        }
      });
    });
  });
  describe('Droit en lecture sur une collectivité -> NOK', async () => {
    test('Utilisateur vérifié sur sa collectivité -> OK', async () => {
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperation.COLLECTIVITES_LECTURE,
          ResourceType.COLLECTIVITE,
          1,
          true
        )
      ).toBeTruthy;
    });

    test('Utilisateur non vérifié sur sa collectivité -> OK', async () => {
      await roleUpdateService.setIsVerified(yoloDodoUser.id, false)
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperation.COLLECTIVITES_LECTURE,
          ResourceType.COLLECTIVITE,
          1,
          true
        )
      ).toBeTruthy;

      onTestFinished(async () => {
        try {
          await roleUpdateService.setIsVerified(yoloDodoUser.id, true)
        } catch (error) {
          console.error('Erreur lors de la remise à zéro des données.', error);
        }
      });
    });

    test('Utilisateur vérifié sur une autre collectivité -> NOK', async () => {
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperation.COLLECTIVITES_LECTURE,
          ResourceType.COLLECTIVITE,
          20,
          true
        )
      ).toBeFalsy;
    });
    test('Support sur une collectivité -> OK', async () => {
      await roleUpdateService.setIsSupport(yoloDodoUser.id, true);
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperation.COLLECTIVITES_LECTURE,
          ResourceType.COLLECTIVITE,
          20,
          true
        )
      ).toBeFalsy;

      onTestFinished(async () => {
        try {
          await roleUpdateService.setIsSupport(yoloDodoUser.id, false)
        } catch (error) {
          console.error('Erreur lors de la remise à zéro des données.', error);
        }
      });
    });
    test('Auditeur sur sa collectivité audité -> OK', async () => {
      expect(
        await permissionService.isAllowed(
          youlouDoudouUser,
          PermissionOperation.COLLECTIVITES_LECTURE,
          ResourceType.COLLECTIVITE,
          10,
          true
        )
      ).toBeTruthy;
    });
  });

  describe('Droit en edition sur une collectivité -> NOK', async () => {
    test('Sur sa collectivité -> OK', async () => {
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperation.PLANS_FICHES_EDITION,
          ResourceType.COLLECTIVITE,
          1,
          true
        )
      ).toBeFalsy;
    });
    test('Sur une autre collectivité -> NOK', async () => {
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperation.PLANS_FICHES_EDITION,
          ResourceType.COLLECTIVITE,
          20,
          true
        )
      ).toBeFalsy;
    });
  });

  describe("Droit en lecture sur la trajectoire d'une collectivité -> NOK", async () => {
    test('Sur sa collectivité -> OK', async () => {
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperation.INDICATEURS_TRAJECTOIRES_LECTURE,
          ResourceType.COLLECTIVITE,
          1,
          true
        )
      ).toBeTruthy;
    });

    test('Sur une autre collectivité -> NOK', async () => {
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperation.INDICATEURS_TRAJECTOIRES_LECTURE,
          ResourceType.COLLECTIVITE,
          20,
          true
        )
      ).toBeFalsy;
    });

    test('Utilisateur Ademe sur une collectivité -> OK', async () => {
      await databaseService.db
        .update(dcpTable)
        .set({ email: 'yolo@ademe.fr' })
        .where(eq(dcpTable.userId, yoloDodoUser.id));
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperation.INDICATEURS_TRAJECTOIRES_LECTURE,
          ResourceType.COLLECTIVITE,
          20,
          true
        )
      ).toBeTruthy;

      onTestFinished(async () => {
        try {
          await databaseService.db
            .update(dcpTable)
            .set({ email: 'yolo@dodo.com' })
            .where(eq(dcpTable.userId, yoloDodoUser.id));
        } catch (error) {
          console.error('Erreur lors de la remise à zéro des données.', error);
        }
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
