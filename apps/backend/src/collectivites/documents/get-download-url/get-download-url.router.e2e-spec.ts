import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { seedTestDocument } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { getAuthUserFromUserCredentials } from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../../test/app-utils';

const UNKNOWN_FICHIER_ID = 999999999;
const UNKNOWN_COLLECTIVITE_ID = 999999999;

describe('GetDownloadUrlRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseServiceInterface;
  let collectivite: Collectivite;
  let lecteurUser: AuthenticatedUser;
  let nonMembreUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const { collectivite: testCollectivite, users } =
      await addTestCollectiviteAndUsers(databaseService, {
        users: [{ role: CollectiviteRole.LECTURE }],
      });

    collectivite = testCollectivite;
    lecteurUser = getAuthUserFromUserCredentials(users[0]);

    const { user } = await addTestUser(databaseService);
    nonMembreUser = getAuthUserFromUserCredentials(user);

    return async () => {
      await app.close();
    };
  });

  test("un compte verifie non membre franchit la garde d'une collectivite publique", async () => {
    const caller = router.createCaller({ user: nonMembreUser });

    await expect(() =>
      caller.collectivites.documents.getDownloadUrl({
        collectiviteId: collectivite.id,
        fichierId: UNKNOWN_FICHIER_ID,
      })
    ).rejects.toThrowError(/n'existe pas/i);
  });

  test("rend DOCUMENT_NOT_FOUND a un lecteur de la collectivite quand l'identifiant ne designe rien", async () => {
    const caller = router.createCaller({ user: lecteurUser });

    await expect(() =>
      caller.collectivites.documents.getDownloadUrl({
        collectiviteId: collectivite.id,
        fichierId: UNKNOWN_FICHIER_ID,
      })
    ).rejects.toThrowError(/n'existe pas/i);
  });

  test('signe un document dont le hash est un uuid herite, hors format sha-256', async () => {
    const document = await seedTestDocument({
      databaseService,
      collectiviteId: collectivite.id,
      filename: 'deliberation-heritee.pdf',
    });
    expect(document.hash).not.toMatch(/^[0-9a-f]{64}$/);

    const caller = router.createCaller({ user: lecteurUser });

    const downloadUrl = await caller.collectivites.documents.getDownloadUrl({
      collectiviteId: collectivite.id,
      fichierId: document.id,
    });

    expect(downloadUrl).toEqual({
      signedUrl: expect.stringContaining(document.hash),
      filename: 'deliberation-heritee.pdf',
    });
  });

  test("refuse un document d'une autre collectivite passe par son identifiant", async () => {
    const { collectivite: autreCollectivite } =
      await addTestCollectiviteAndUsers(databaseService, { users: [] });
    const documentAutreCollectivite = await seedTestDocument({
      databaseService,
      collectiviteId: autreCollectivite.id,
      filename: 'hors-perimetre.pdf',
    });

    const caller = router.createCaller({ user: lecteurUser });

    await expect(() =>
      caller.collectivites.documents.getDownloadUrl({
        collectiviteId: collectivite.id,
        fichierId: documentAutreCollectivite.id,
      })
    ).rejects.toThrowError(/n'existe pas/i);
  });

  test('rend « collectivité introuvable » a un compte verifie non membre pour une collectivite inconnue', async () => {
    const caller = router.createCaller({ user: nonMembreUser });

    await expect(() =>
      caller.collectivites.documents.getDownloadUrl({
        collectiviteId: UNKNOWN_COLLECTIVITE_ID,
        fichierId: UNKNOWN_FICHIER_ID,
      })
    ).rejects.toThrowError(
      `Collectivité avec l'identifiant ${UNKNOWN_COLLECTIVITE_ID} introuvable`
    );
  });
});
