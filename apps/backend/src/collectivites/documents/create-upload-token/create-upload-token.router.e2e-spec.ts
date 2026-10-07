import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { seedTestDocument } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { getAuthUserFromUserCredentials } from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite, toDocumentHash } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../../test/app-utils';

const HASH = toDocumentHash(
  'ec07d0538e44a333b23b936c9a4ba37fbd211c6272e632d2173b6abe102a0482'
);
const HASH_IN_BIBLIOTHEQUE = toDocumentHash(
  '5f70bf18a086007016e948b04aed3b82103a36bea41755b6cddfaf10ace3c6ef'
);
const HASH_IN_OTHER_COLLECTIVITE = toDocumentHash(
  '9b74c9897bac770ffc029102a200c5de0de8a3bb61d6d17ba14d4be3b7ab8cb1'
);

describe('CreateUploadTokenRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let readerUser: AuthenticatedUser;
  let nonMembreUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const { collectivite: testCollectivite, users } =
      await addTestCollectiviteAndUsers(databaseService, {
        users: [
          { role: CollectiviteRole.EDITION },
          { role: CollectiviteRole.LECTURE },
        ],
      });

    collectivite = testCollectivite;
    editorUser = getAuthUserFromUserCredentials(users[0]);
    readerUser = getAuthUserFromUserCredentials(users[1]);

    const { user } = await addTestUser(databaseService);
    nonMembreUser = getAuthUserFromUserCredentials(user);

    return async () => {
      await app.close();
    };
  });

  test('refuse un hash qui designe un autre bucket, avant tout controle de droit', async () => {
    const caller = router.createCaller({ user: nonMembreUser });

    await expect(() =>
      caller.collectivites.documents.createUploadToken({
        collectiviteId: collectivite.id,
        hash: `autreBucket/${HASH}`,
      })
    ).rejects.toThrowError(/hash/i);
  });

  test('refuse un utilisateur en lecture seule sur la collectivite', async () => {
    const caller = router.createCaller({ user: readerUser });

    await expect(() =>
      caller.collectivites.documents.createUploadToken({
        collectiviteId: collectivite.id,
        hash: HASH,
      })
    ).rejects.toThrowError(
      /permissions necessaires|permissions n\u00e9cessaires/i
    );
  });

  test("refuse un utilisateur qui n'est membre d'aucune collectivite", async () => {
    const caller = router.createCaller({ user: nonMembreUser });

    await expect(() =>
      caller.collectivites.documents.createUploadToken({
        collectiviteId: collectivite.id,
        hash: HASH,
      })
    ).rejects.toThrowError(
      /permissions necessaires|permissions n\u00e9cessaires/i
    );
  });

  test('emet un jeton pour un utilisateur en edition sur la collectivite', async () => {
    const caller = router.createCaller({ user: editorUser });

    const result = await caller.collectivites.documents.createUploadToken({
      collectiviteId: collectivite.id,
      hash: HASH,
    });

    expect(result).toEqual({
      kind: 'readyToUpload',
      token: expect.any(String),
      bucketId: expect.any(String),
      path: HASH,
    });
  });

  test('rend le nom du fichier déjà présent dans la bibliothèque, confidentiel compris', async () => {
    const document = await seedTestDocument({
      databaseService,
      collectiviteId: collectivite.id,
      filename: 'rapport-confidentiel.pdf',
      confidentiel: true,
      hash: HASH_IN_BIBLIOTHEQUE,
    });
    const caller = router.createCaller({ user: editorUser });

    const result = await caller.collectivites.documents.createUploadToken({
      collectiviteId: collectivite.id,
      hash: HASH_IN_BIBLIOTHEQUE,
    });

    expect(result).toEqual({
      kind: 'alreadyInBibliotheque',
      fichierId: document.id,
      filename: 'rapport-confidentiel.pdf',
    });
  });

  test("ne rend pas le nom d'un fichier au même hash dans une autre collectivité", async () => {
    const { collectivite: otherCollectivite } =
      await addTestCollectiviteAndUsers(databaseService, { users: [] });
    await seedTestDocument({
      databaseService,
      collectiviteId: otherCollectivite.id,
      filename: 'autre-collectivite.pdf',
      hash: HASH_IN_OTHER_COLLECTIVITE,
    });
    const caller = router.createCaller({ user: editorUser });

    const result = await caller.collectivites.documents.createUploadToken({
      collectiviteId: collectivite.id,
      hash: HASH_IN_OTHER_COLLECTIVITE,
    });

    expect(result).toEqual({
      kind: 'readyToUpload',
      token: expect.any(String),
      bucketId: expect.any(String),
      path: HASH_IN_OTHER_COLLECTIVITE,
    });
  });
});
