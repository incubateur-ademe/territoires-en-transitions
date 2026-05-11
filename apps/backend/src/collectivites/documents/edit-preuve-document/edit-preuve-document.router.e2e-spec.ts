import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { uploadCreateTestDocument } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { createFiche } from '@tet/backend/plans/fiches/fiches.test-fixture';
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

describe('EditPreuveDocumentRouter', () => {
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
      { users: [{ role: CollectiviteRole.EDITION }] }
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
      fileName: 'preuve-update-lien-test.pdf',
    });
    fichierId = doc.id;

    const visiteurResult = await addTestUser(db);
    visiteurUser = getAuthUserFromUserCredentials(visiteurResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('updatePreuve', () => {
    test('un éditeur peut mettre à jour une annexe (preuve)', async () => {
      const caller = router.createCaller({ user: editorUser });
      const ficheId = await createFiche({
        caller,
        ficheInput: {
          titre: 'Fiche annexe lien à modifier',
          collectiviteId: collectivite.id,
        },
      });

      const annexe = await caller.plans.fiches.addAnnexe({
        ficheId,
        commentaire: '',
        lien: { url: 'https://example.com/a', titre: 'Titre A' },
      });

      const updated = await caller.collectivites.documents.updatePreuve({
        preuveId: annexe.id,
        preuveType: 'annexe',
        lien: { url: 'https://example.com/b', titre: 'Titre B' },
        commentaire: 'nouveau',
      });

      expect(updated.id).toBe(annexe.id);
      expect(updated.url).toBe('https://example.com/b');
      expect(updated.titre).toBe('Titre B');
      expect(updated.commentaire).toBe('nouveau');
    });

    test('un visiteur ne peut pas mettre à jour une annexe (preuve)', async () => {
      const editorCaller = router.createCaller({ user: editorUser });
      const ficheId = await createFiche({
        caller: editorCaller,
        ficheInput: {
          titre: 'Fiche annexe protégée',
          collectiviteId: collectivite.id,
        },
      });

      const annexe = await editorCaller.plans.fiches.addAnnexe({
        ficheId,
        lien: { url: 'https://example.com', titre: 'X' },
      });

      const visiteurCaller = router.createCaller({ user: visiteurUser });

      await expect(
        visiteurCaller.collectivites.documents.updatePreuve({
          preuveId: annexe.id,
          preuveType: 'annexe',
          lien: { url: 'https://evil.com', titre: 'Y' },
        })
      ).rejects.toThrowError(/Droits insuffisants|permissions nécessaires/i);
    });

    test("la transformation d'une annexe fichier en lien est refusée", async () => {
      const caller = router.createCaller({ user: editorUser });
      const ficheId = await createFiche({
        caller,
        ficheInput: {
          titre: 'Fiche annexe fichier',
          collectiviteId: collectivite.id,
        },
      });

      const annexe = await caller.plans.fiches.addAnnexe({
        ficheId,
        commentaire: '',
        fichierId,
      });

      await expect(
        caller.collectivites.documents.updatePreuve({
          preuveId: annexe.id,
          preuveType: 'annexe',
          lien: { url: 'https://example.com', titre: 'Nope' },
        })
      ).rejects.toThrowError(/fichier/i);
    });

    test('une preuve inexistante renvoie une erreur', async () => {
      const caller = router.createCaller({ user: editorUser });

      await expect(
        caller.collectivites.documents.updatePreuve({
          preuveId: 2_000_000_000,
          preuveType: 'annexe',
          lien: { url: 'https://example.com', titre: 'X' },
        })
      ).rejects.toThrowError(/n'existe pas/i);
    });
  });

  describe('removePreuve', () => {
    test('un éditeur peut supprimer une preuve (annexe)', async () => {
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

      const result = await caller.collectivites.documents.removePreuve({
        preuveId: annexe.id,
        preuveType: 'annexe',
      });

      expect(result.id).toBe(annexe.id);

      await expect(
        caller.collectivites.documents.removePreuve({
          preuveId: annexe.id,
          preuveType: 'annexe',
        })
      ).rejects.toThrowError(/n'existe pas|not found/i);
    });

    test('un visiteur ne peut pas supprimer de preuve (annexe)', async () => {
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
        visiteurCaller.collectivites.documents.removePreuve({
          preuveId: annexe.id,
          preuveType: 'annexe',
        })
      ).rejects.toThrowError(/Droits insuffisants|permissions nécessaires/i);
    });
  });
});
