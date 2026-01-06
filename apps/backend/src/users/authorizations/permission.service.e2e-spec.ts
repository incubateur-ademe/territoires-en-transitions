import { INestApplication } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  YOULOU_DOUDOU,
} from '@tet/backend/test';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ResourceType } from '@tet/backend/users/authorizations/resource-type.enum';
import { UpdateUserRoleService } from '@tet/backend/users/authorizations/update-user-role/update-user-role.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { PermissionOperationEnum } from '@tet/domain/users';
import { eq } from 'drizzle-orm';

describe('Gestion des droits', () => {
  let app: INestApplication;
  let permissionService: PermissionService;
  let yoloDodoUser: AuthenticatedUser;
  let youlouDoudouUser: AuthenticatedUser;
  let databaseService: DatabaseService;
  let roleUpdateService: UpdateUserRoleService;
  let collectiviteService: CollectivitesService;

  beforeAll(async () => {
    app = await getTestApp();
    permissionService = app.get(PermissionService);
    roleUpdateService = app.get(UpdateUserRoleService);
    collectiviteService = app.get(CollectivitesService);
    yoloDodoUser = await getAuthUser();
    youlouDoudouUser = await getAuthUser(YOULOU_DOUDOU);
    databaseService = await getTestDatabase(app);
  });

  describe('Droit en visite sur une collectivité -> NOK', async () => {
    test('Utilisateur vérifié -> OK', async () => {
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperationEnum['COLLECTIVITES.READ_PUBLIC'],
          ResourceType.COLLECTIVITE,
          20,
          true
        )
      ).toBeTruthy();
    });
    test('Utilisateur non vérifié -> NOK', async () => {
      await roleUpdateService.setIsVerified(yoloDodoUser.id, false);
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperationEnum['COLLECTIVITES.READ_PUBLIC'],
          ResourceType.COLLECTIVITE,
          20,
          true
        )
      ).toBeFalsy();

      onTestFinished(async () => {
        try {
          await roleUpdateService.setIsVerified(yoloDodoUser.id, true);
        } catch (error) {
          console.error('Erreur lors de la remise à zéro des données.', error);
        }
      });
    });
    test('Collectivité en accès restreint -> NOK', async () => {
      await databaseService.db
        .update(collectiviteTable)
        .set({ accesRestreint: true })
        .where(eq(collectiviteTable.id, 20));

      const collectivitePrivate = await collectiviteService.isPrivate(20);
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          collectivitePrivate
            ? PermissionOperationEnum['COLLECTIVITES.READ']
            : PermissionOperationEnum['COLLECTIVITES.READ_PUBLIC'],
          ResourceType.COLLECTIVITE,
          20,
          true
        )
      ).toBeFalsy();

      onTestFinished(async () => {
        try {
          await databaseService.db
            .update(collectiviteTable)
            .set({ accesRestreint: false })
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
          PermissionOperationEnum['COLLECTIVITES.READ'],
          ResourceType.COLLECTIVITE,
          1,
          true
        )
      ).toBeTruthy();
    });

    test('Utilisateur non vérifié sur sa collectivité -> OK', async () => {
      await roleUpdateService.setIsVerified(yoloDodoUser.id, false);
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperationEnum['COLLECTIVITES.READ'],
          ResourceType.COLLECTIVITE,
          1,
          true
        )
      ).toBeTruthy();

      onTestFinished(async () => {
        try {
          await roleUpdateService.setIsVerified(yoloDodoUser.id, true);
        } catch (error) {
          console.error('Erreur lors de la remise à zéro des données.', error);
        }
      });
    });

    test('Utilisateur vérifié sur une autre collectivité -> NOK', async () => {
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperationEnum['COLLECTIVITES.READ'],
          ResourceType.COLLECTIVITE,
          20,
          true
        )
      ).toBeFalsy();
    });

    test('Auditeur sur sa collectivité audité -> OK', async () => {
      expect(
        await permissionService.isAllowed(
          youlouDoudouUser,
          PermissionOperationEnum['COLLECTIVITES.READ'],
          ResourceType.COLLECTIVITE,
          10,
          true
        )
      ).toBeTruthy();
    });
  });

  describe('Droit en edition sur une collectivité -> NOK', async () => {
    test('Sur sa collectivité -> OK', async () => {
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperationEnum['PLANS.FICHES.UPDATE'],
          ResourceType.COLLECTIVITE,
          1,
          true
        )
      ).toBeTruthy();
    });
    test('Sur une autre collectivité -> NOK', async () => {
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperationEnum['PLANS.FICHES.UPDATE'],
          ResourceType.COLLECTIVITE,
          20,
          true
        )
      ).toBeFalsy();
    });

    test("Ecriture du referentiel sur une collectivité dont on est l'auditeur -> OK", async () => {
      expect(
        await permissionService.isAllowed(
          youlouDoudouUser,
          PermissionOperationEnum['REFERENTIELS.MUTATE'],
          ResourceType.COLLECTIVITE,
          10,
          true
        )
      ).toBeTruthy();
    });
  });

  describe("Droit en lecture sur les indicateurs d'une collectivité -> NOK", async () => {
    test('Sur sa collectivité -> OK', async () => {
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperationEnum['INDICATEURS.INDICATEURS.READ'],
          ResourceType.COLLECTIVITE,
          1,
          true
        )
      ).toBeTruthy();
    });

    test('Sur une autre collectivité -> NOK', async () => {
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperationEnum['INDICATEURS.INDICATEURS.READ'],
          ResourceType.COLLECTIVITE,
          20,
          true
        )
      ).toBeFalsy();
    });

    test('Utilisateur Ademe sur une collectivité -> OK', async () => {
      await databaseService.db
        .update(dcpTable)
        .set({ email: 'yolo@ademe.fr' })
        .where(eq(dcpTable.userId, yoloDodoUser.id));
      expect(
        await permissionService.isAllowed(
          yoloDodoUser,
          PermissionOperationEnum['INDICATEURS.INDICATEURS.READ'],
          ResourceType.COLLECTIVITE,
          20,
          true
        )
      ).toBeTruthy();

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
