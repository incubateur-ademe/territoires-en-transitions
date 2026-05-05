import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { uploadCreateTestDocument } from '@tet/backend/collectivites/documents/documents.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
  signInWith,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import request from 'supertest';
import { createFiche } from '../fiches.test-fixture';

describe('AddAnnexeRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let visiteurUser: AuthenticatedUser;
  let editorAuthToken: string;
  let fichierId: number;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const testCollectiviteAndUsersResult = await addTestCollectiviteAndUsers(
      db,
      {
        users: [
          {
            role: CollectiviteRole.EDITION,
          },
        ],
      }
    );

    collectivite = testCollectiviteAndUsersResult.collectivite;
    const editorFixture = testCollectiviteAndUsersResult.users[0];
    editorUser = getAuthUserFromUserCredentials(editorFixture);

    const signIn = await signInWith({
      email: editorFixture.email,
      password: editorFixture.password,
    });
    editorAuthToken = signIn.data.session?.access_token ?? '';
    if (!editorAuthToken) {
      throw new Error('token éditeur manquant');
    }

    const testAgent = request(app.getHttpServer());
    const doc = await uploadCreateTestDocument({
      collectiviteId: collectivite.id,
      testAgent,
      token: editorAuthToken,
      fileName: 'annexe-test.pdf',
    });
    fichierId = doc.id;

    const visiteurResult = await addTestUser(db);
    visiteurUser = getAuthUserFromUserCredentials(visiteurResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  test('un éditeur peut créer une annexe (lien)', async () => {
    const caller = router.createCaller({ user: editorUser });
    const ficheId = await createFiche({
      caller,
      ficheInput: {
        titre: 'Fiche avec annexe lien',
        collectiviteId: collectivite.id,
      },
    });

    const annexe = await caller.plans.fiches.addAnnexe({
      ficheId,
      commentaire: '',
      lien: { url: 'https://example.com/doc', titre: 'Lien exemple' },
    });

    expect(annexe.id).toBeDefined();
    expect(annexe.ficheId).toBe(ficheId);
    expect(annexe.collectiviteId).toBe(collectivite.id);
    expect(annexe.url).toBe('https://example.com/doc');
  });

  test('un éditeur peut créer une annexe (fichier)', async () => {
    const caller = router.createCaller({ user: editorUser });
    const ficheId = await createFiche({
      caller,
      ficheInput: {
        titre: 'Fiche avec annexe fichier',
        collectiviteId: collectivite.id,
      },
    });

    const annexe = await caller.plans.fiches.addAnnexe({
      ficheId,
      commentaire: '',
      fichierId,
    });

    expect(annexe.id).toBeDefined();
    expect(annexe.collectiviteId).toBe(collectivite.id);
    expect(annexe.fichierId).toBe(fichierId);
  });

  test("un visiteur ne peut pas créer d'annexe sur une fiche d'une collectivité", async () => {
    const editorCaller = router.createCaller({ user: editorUser });
    const ficheId = await createFiche({
      caller: editorCaller,
      ficheInput: {
        titre: 'Fiche protégée',
        collectiviteId: collectivite.id,
      },
    });

    const visiteurCaller = router.createCaller({ user: visiteurUser });

    await expect(
      visiteurCaller.plans.fiches.addAnnexe({
        ficheId,
        lien: { url: 'https://example.com', titre: 'X' },
      })
    ).rejects.toThrowError(/Droits insuffisants/i);
  });
});
