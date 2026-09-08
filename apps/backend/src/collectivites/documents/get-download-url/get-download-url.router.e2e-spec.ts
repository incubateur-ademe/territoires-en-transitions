import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getAuthUserFromUserCredentials } from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../../test/app-utils';

const HASH = 'ec07d0538e44a333b23b936c9a4ba37fbd211c6272e632d2173b6abe102a0482';

describe('GetDownloadUrlRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let collectivite: Collectivite;
  let lecteurUser: AuthenticatedUser;
  let nonMembreUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    const databaseService = await getTestDatabase(app);

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

  test('refuse un hash qui designe un autre bucket, avant tout controle de droit', async () => {
    const caller = router.createCaller({ user: nonMembreUser });

    await expect(() =>
      caller.collectivites.documents.getDownloadUrl({
        collectiviteId: collectivite.id,
        hash: `autreBucket/${HASH}`,
      })
    ).rejects.toThrowError(/hash/i);
  });

  test("un compte verifie non membre franchit la garde d'une collectivite publique", async () => {
    const caller = router.createCaller({ user: nonMembreUser });

    await expect(() =>
      caller.collectivites.documents.getDownloadUrl({
        collectiviteId: collectivite.id,
        hash: HASH,
      })
    ).rejects.toThrowError(/n'existe pas/i);
  });

  test('rend DOCUMENT_NOT_FOUND a un lecteur de la collectivite quand le hash ne designe rien', async () => {
    const caller = router.createCaller({ user: lecteurUser });

    await expect(() =>
      caller.collectivites.documents.getDownloadUrl({
        collectiviteId: collectivite.id,
        hash: HASH,
      })
    ).rejects.toThrowError(/n'existe pas/i);
  });
});
