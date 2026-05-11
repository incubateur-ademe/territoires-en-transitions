import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
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
import { createFiche } from '../fiches.test-fixture';

describe('RemoveAnnexeRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let visiteurUser: AuthenticatedUser;
  let editorAuthToken: string;

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

    const visiteurResult = await addTestUser(db);
    visiteurUser = getAuthUserFromUserCredentials(visiteurResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  test('un éditeur peut supprimer une annexe (lien)', async () => {
    const caller = router.createCaller({ user: editorUser });
    const ficheId = await createFiche({
      caller,
      ficheInput: {
        titre: 'Fiche annexe à supprimer',
        collectiviteId: collectivite.id,
      },
    });

    const annexe = await caller.plans.fiches.addAnnexe({
      ficheId,
      commentaire: '',
      lien: { url: 'https://example.com/doc', titre: 'Lien exemple' },
    });

    const result = await caller.plans.fiches.removeAnnexe({
      annexeId: annexe.id,
    });

    expect(result.id).toBe(annexe.id);

    await expect(
      caller.plans.fiches.removeAnnexe({ annexeId: annexe.id })
    ).rejects.toThrowError(/n'existe pas|not found/i);
  });

  test("un visiteur ne peut pas supprimer d'annexe", async () => {
    const editorCaller = router.createCaller({ user: editorUser });
    const ficheId = await createFiche({
      caller: editorCaller,
      ficheInput: {
        titre: 'Fiche avec annexe protégée',
        collectiviteId: collectivite.id,
      },
    });

    const annexe = await editorCaller.plans.fiches.addAnnexe({
      ficheId,
      lien: { url: 'https://example.com', titre: 'X' },
    });

    const visiteurCaller = router.createCaller({ user: visiteurUser });

    await expect(
      visiteurCaller.plans.fiches.removeAnnexe({ annexeId: annexe.id })
    ).rejects.toThrowError(/Droits insuffisants/i);
  });
});
