import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import {
  addAuditeurPermission,
  createAudit,
} from '@tet/backend/referentiels/labellisations/labellisations.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { UpdateUserRoleService } from '@tet/backend/users/authorizations/update-user-role/update-user-role.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Collectivite } from '@tet/domain/collectivites';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import {
  CollectiviteRole,
  PermissionOperationEnum,
  ResourceType,
} from '@tet/domain/users';
import { eq } from 'drizzle-orm';

describe('Gestion des droits', () => {
  let app: INestApplication;
  let permissionService: PermissionService;
  let databaseService: DatabaseService;
  let roleUpdateService: UpdateUserRoleService;
  let collectiviteService: CollectivitesService;

  let testUser: AuthenticatedUser;
  let testUserOriginalEmail: string;
  let auditeurUser: AuthenticatedUser;

  // testUser est ADMIN ici
  let ownCollectivite: Collectivite;
  // collectivité publique dont testUser n'est pas membre
  let otherCollectivite: Collectivite;
  // collectivité créée directement en accès restreint (pas de mutation/revert)
  let otherRestrictedCollectivite: Collectivite;
  // collectivité auditée par auditeurUser
  let auditedCollectivite: Collectivite;

  beforeAll(async () => {
    app = await getTestApp();
    permissionService = app.get(PermissionService);
    roleUpdateService = app.get(UpdateUserRoleService);
    collectiviteService = app.get(CollectivitesService);
    databaseService = await getTestDatabase(app);

    // Collectivité + utilisateur admin (l'utilisateur sous test)
    const ownSetup = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    ownCollectivite = ownSetup.collectivite;
    testUser = getAuthUserFromUserCredentials(ownSetup.user);
    testUserOriginalEmail = ownSetup.user.email ?? '';

    // Collectivité publique dont testUser n'est pas membre
    const otherPublicResult = await addTestCollectivite(databaseService);
    otherCollectivite = otherPublicResult.collectivite;

    // Collectivité en accès restreint dès sa création : aucune mutation
    // transitoire de l'état partagé, donc pas de fenêtre de race pour d'autres
    // tests parallèles.
    const restrictedResult = await addTestCollectivite(databaseService, {
      accesRestreint: true,
    });
    otherRestrictedCollectivite = restrictedResult.collectivite;

    // Collectivité auditée + auditeur isolé (remplace la dépendance à
    // YOULOU_DOUDOU + collectiviteId seed 10).
    const auditedResult = await addTestCollectivite(databaseService);
    auditedCollectivite = auditedResult.collectivite;

    const auditeurResult = await addTestUser(databaseService);
    auditeurUser = getAuthUserFromUserCredentials(auditeurResult.user);

    const { audit } = await createAudit({
      databaseService,
      collectiviteId: auditedCollectivite.id,
      referentielId: ReferentielIdEnum.CAE,
    });
    await addAuditeurPermission({
      databaseService,
      auditId: audit.id,
      userId: auditeurResult.user.id,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Droit d'accès en visite sur une collectivité publique", () => {
    test('Utilisateur vérifié -> OK', async () => {
      expect(
        await permissionService.isAllowed(
          testUser,
          'collectivites.read',
          ResourceType.COLLECTIVITE,
          otherCollectivite.id,
          true
        )
      ).toBeTruthy();
    });

    test('Utilisateur non vérifié -> NOK', async () => {
      await roleUpdateService.setIsVerified(testUser.id, false);
      onTestFinished(async () => {
        try {
          await roleUpdateService.setIsVerified(testUser.id, true);
        } catch (error) {
          console.error('Erreur lors de la remise à zéro des données.', error);
        }
      });

      expect(
        await permissionService.isAllowed(
          testUser,
          'collectivites.read',
          ResourceType.COLLECTIVITE,
          otherCollectivite.id,
          true
        )
      ).toBeFalsy();
    });

    test('Collectivité en accès restreint -> NOK', async () => {
      const collectivitePrivate = await collectiviteService.isPrivate(
        otherRestrictedCollectivite.id
      );
      expect(
        await permissionService.isAllowed(
          testUser,
          collectivitePrivate
            ? 'collectivites.read_confidentiel'
            : 'collectivites.read',
          ResourceType.COLLECTIVITE,
          otherRestrictedCollectivite.id,
          true
        )
      ).toBeFalsy();
    });
  });

  describe("Droit d'accès en lecture confidentielle sur une collectivité", () => {
    test('Utilisateur vérifié sur sa collectivité -> OK', async () => {
      expect(
        await permissionService.isAllowed(
          testUser,
          'collectivites.read_confidentiel',
          ResourceType.COLLECTIVITE,
          ownCollectivite.id,
          true
        )
      ).toBeTruthy();
    });

    test('Utilisateur non vérifié sur sa collectivité -> OK', async () => {
      await roleUpdateService.setIsVerified(testUser.id, false);
      onTestFinished(async () => {
        try {
          await roleUpdateService.setIsVerified(testUser.id, true);
        } catch (error) {
          console.error('Erreur lors de la remise à zéro des données.', error);
        }
      });

      expect(
        await permissionService.isAllowed(
          testUser,
          'collectivites.read_confidentiel',
          ResourceType.COLLECTIVITE,
          ownCollectivite.id,
          true
        )
      ).toBeTruthy();
    });

    test('Utilisateur vérifié sur une autre collectivité -> NOK', async () => {
      expect(
        await permissionService.isAllowed(
          testUser,
          'collectivites.read_confidentiel',
          ResourceType.COLLECTIVITE,
          otherCollectivite.id,
          true
        )
      ).toBeFalsy();
    });

    test('Auditeur sur la collectivité auditée -> OK', async () => {
      expect(
        await permissionService.isAllowed(
          auditeurUser,
          'collectivites.read_confidentiel',
          ResourceType.COLLECTIVITE,
          auditedCollectivite.id,
          true
        )
      ).toBeTruthy();
    });
  });

  describe("Droit d'accès en édition sur une collectivité", () => {
    test('Sur sa collectivité -> OK', async () => {
      expect(
        await permissionService.isAllowed(
          testUser,
          PermissionOperationEnum['PLANS.FICHES.UPDATE'],
          ResourceType.COLLECTIVITE,
          ownCollectivite.id,
          true
        )
      ).toBeTruthy();
    });

    test('Sur une autre collectivité -> NOK', async () => {
      expect(
        await permissionService.isAllowed(
          testUser,
          PermissionOperationEnum['PLANS.FICHES.UPDATE'],
          ResourceType.COLLECTIVITE,
          otherCollectivite.id,
          true
        )
      ).toBeFalsy();
    });

    test("Ecriture du référentiel sur une collectivité dont on est l'auditeur -> OK", async () => {
      expect(
        await permissionService.isAllowed(
          auditeurUser,
          PermissionOperationEnum['REFERENTIELS.MUTATE'],
          ResourceType.COLLECTIVITE,
          auditedCollectivite.id,
          true
        )
      ).toBeTruthy();
    });
  });

  describe("Droit d'accès en lecture aux indicateurs d'une collectivité", () => {
    test('Sur sa collectivité -> OK', async () => {
      expect(
        await permissionService.isAllowed(
          testUser,
          'indicateurs.indicateurs.read_confidentiel',
          ResourceType.COLLECTIVITE,
          ownCollectivite.id,
          true
        )
      ).toBeTruthy();
    });

    test('Sur une autre collectivité -> NOK', async () => {
      expect(
        await permissionService.isAllowed(
          testUser,
          'indicateurs.indicateurs.read_confidentiel',
          ResourceType.COLLECTIVITE,
          otherCollectivite.id,
          true
        )
      ).toBeFalsy();
    });

    test('Utilisateur Ademe sur une collectivité -> OK', async () => {
      await databaseService.db
        .update(dcpTable)
        .set({ email: 'yolo@ademe.fr' })
        .where(eq(dcpTable.id, testUser.id));
      onTestFinished(async () => {
        try {
          await databaseService.db
            .update(dcpTable)
            .set({ email: testUserOriginalEmail })
            .where(eq(dcpTable.id, testUser.id));
        } catch (error) {
          console.error('Erreur lors de la remise à zéro des données.', error);
        }
      });

      expect(
        await permissionService.isAllowed(
          testUser,
          'indicateurs.indicateurs.read_confidentiel',
          ResourceType.COLLECTIVITE,
          otherCollectivite.id,
          true
        )
      ).toBeTruthy();
    });
  });
});
