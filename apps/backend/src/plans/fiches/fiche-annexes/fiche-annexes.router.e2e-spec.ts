import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  OTHER_PDF_SAMPLE_FILE,
  uploadCreateTestDocument,
} from '@tet/backend/collectivites/documents/documents.test-fixture';
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
import { BibliothequeFichier, Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import request from 'supertest';
import { createFiche } from '../fiches.test-fixture';

describe('FicheAnnexesRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let editorAuthToken: string;
  let docPublic: BibliothequeFichier;
  let docConfidentiel: BibliothequeFichier;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const { collectivite: col, users } = await addTestCollectiviteAndUsers(db, {
      users: [{ role: CollectiviteRole.EDITION }],
    });
    collectivite = col;

    const editorFixture = users[0];
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
    docPublic = await uploadCreateTestDocument({
      collectiviteId: collectivite.id,
      testAgent,
      token: editorAuthToken,
      fileName: 'public.pdf',
    });
    docConfidentiel = await uploadCreateTestDocument({
      collectiviteId: collectivite.id,
      testAgent,
      token: editorAuthToken,
      confidentiel: true,
      fileName: 'confidentiel.pdf',
      sampleFileName: OTHER_PDF_SAMPLE_FILE,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  test('aucune annexe pour les fiches données : retourne un tableau vide', async () => {
    const caller = router.createCaller({ user: editorUser });
    const ficheId = await createFiche({
      caller,
      ficheInput: {
        titre: 'Fiche sans annexe',
        collectiviteId: collectivite.id,
      },
    });

    const result = await caller.plans.fiches.ficheAnnexes({
      collectiviteId: collectivite.id,
      ficheIds: [ficheId],
    });

    expect(result).toEqual([]);
  });

  test('ficheIds vide : retourne un tableau vide', async () => {
    const caller = router.createCaller({ user: editorUser });

    const result = await caller.plans.fiches.ficheAnnexes({
      collectiviteId: collectivite.id,
      ficheIds: [],
    });

    expect(result).toEqual([]);
  });

  test('retourne une annexe lien avec tous les champs attendus', async () => {
    const caller = router.createCaller({ user: editorUser });
    const ficheId = await createFiche({
      caller,
      ficheInput: {
        titre: 'Fiche avec annexe lien',
        collectiviteId: collectivite.id,
      },
    });

    await caller.plans.fiches.addAnnexe({
      ficheId,
      commentaire: 'Mon commentaire',
      lien: { url: 'https://example.com/doc', titre: 'Lien exemple' },
    });

    const result = await caller.plans.fiches.ficheAnnexes({
      collectiviteId: collectivite.id,
      ficheIds: [ficheId],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: expect.any(Number),
      collectiviteId: collectivite.id,
      ficheId,
      commentaire: 'Mon commentaire',
      modifiedAt: expect.any(String),
      modifiedByNom: expect.any(String),
      fichier: null,
      lien: { url: 'https://example.com/doc', titre: 'Lien exemple' },
    });
  });

  test('retourne une annexe fichier avec filename et confidentiel non null', async () => {
    const caller = router.createCaller({ user: editorUser });
    const ficheId = await createFiche({
      caller,
      ficheInput: {
        titre: 'Fiche avec annexe fichier',
        collectiviteId: collectivite.id,
      },
    });

    await caller.plans.fiches.addAnnexe({
      ficheId,
      commentaire: 'Annexe fichier',
      fichierId: docPublic.id,
    });

    const result = await caller.plans.fiches.ficheAnnexes({
      collectiviteId: collectivite.id,
      ficheIds: [ficheId],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      ficheId,
      fichier: {
        filename: 'public.pdf',
        confidentiel: false,
        hash: docPublic.hash,
        bucketId: expect.any(String),
        filesize: expect.any(Number),
      },
      lien: null,
    });
  });

  test('filtre par ficheIds : ne retourne que les annexes des fiches demandées', async () => {
    const caller = router.createCaller({ user: editorUser });

    const ficheIdA = await createFiche({
      caller,
      ficheInput: { titre: 'Fiche A', collectiviteId: collectivite.id },
    });
    const ficheIdB = await createFiche({
      caller,
      ficheInput: { titre: 'Fiche B', collectiviteId: collectivite.id },
    });

    await caller.plans.fiches.addAnnexe({
      ficheId: ficheIdA,
      lien: { url: 'https://a.example', titre: 'Annexe A' },
    });
    await caller.plans.fiches.addAnnexe({
      ficheId: ficheIdB,
      lien: { url: 'https://b.example', titre: 'Annexe B' },
    });

    const onlyA = await caller.plans.fiches.ficheAnnexes({
      collectiviteId: collectivite.id,
      ficheIds: [ficheIdA],
    });
    expect(onlyA).toHaveLength(1);
    expect(onlyA[0].ficheId).toBe(ficheIdA);

    const both = await caller.plans.fiches.ficheAnnexes({
      collectiviteId: collectivite.id,
      ficheIds: [ficheIdA, ficheIdB],
    });
    expect(both).toHaveLength(2);
    const ficheIds = both.map((a) => a.ficheId);
    expect(ficheIds).toContain(ficheIdA);
    expect(ficheIds).toContain(ficheIdB);
  });

  test("isolation par collectivité : ne retourne pas les annexes d'une autre collectivité", async () => {
    const editorCaller = router.createCaller({ user: editorUser });

    // une autre collectivité avec son propre éditeur et sa fiche
    const { collectivite: otherCollectivite, users: otherUsers } =
      await addTestCollectiviteAndUsers(db, {
        users: [{ role: CollectiviteRole.EDITION }],
      });
    const otherEditor = getAuthUserFromUserCredentials(otherUsers[0]);
    const otherCaller = router.createCaller({ user: otherEditor });

    const otherFicheId = await createFiche({
      caller: otherCaller,
      ficheInput: {
        titre: 'Fiche autre collectivité',
        collectiviteId: otherCollectivite.id,
      },
    });
    await otherCaller.plans.fiches.addAnnexe({
      ficheId: otherFicheId,
      lien: { url: 'https://other.example', titre: 'Annexe autre' },
    });

    // requête sur la collectivité initiale avec un ficheId d'une autre collectivité
    const result = await editorCaller.plans.fiches.ficheAnnexes({
      collectiviteId: collectivite.id,
      ficheIds: [otherFicheId],
    });

    expect(result).toEqual([]);
  });

  test("utilisateur vérifié sans rôle dans la collectivité ne voit pas l'annexe liée à un fichier confidentiel", async () => {
    const editorCaller = router.createCaller({ user: editorUser });
    const ficheId = await createFiche({
      caller: editorCaller,
      ficheInput: {
        titre: 'Fiche annexe confidentielle',
        collectiviteId: collectivite.id,
      },
    });

    await editorCaller.plans.fiches.addAnnexe({
      ficheId,
      fichierId: docPublic.id,
    });
    await editorCaller.plans.fiches.addAnnexe({
      ficheId,
      fichierId: docConfidentiel.id,
    });

    // utilisateur vérifié sans rôle dans la collectivité
    const { user: visiteurFixture } = await addTestUser(db);
    const visiteurUser = getAuthUserFromUserCredentials(visiteurFixture);
    const visiteurCaller = router.createCaller({ user: visiteurUser });

    const visiteurResult = await visiteurCaller.plans.fiches.ficheAnnexes({
      collectiviteId: collectivite.id,
      ficheIds: [ficheId],
    });
    expect(visiteurResult).toHaveLength(1);
    expect(visiteurResult[0].fichier?.filename).toBe('public.pdf');
    expect(visiteurResult[0].fichier?.confidentiel).toBe(false);

    // l'éditeur a accès aux deux annexes
    const editorResult = await editorCaller.plans.fiches.ficheAnnexes({
      collectiviteId: collectivite.id,
      ficheIds: [ficheId],
    });
    expect(editorResult).toHaveLength(2);
    const filenames = editorResult.map((a) => a.fichier?.filename ?? null);
    expect(filenames).toContain('public.pdf');
    expect(filenames).toContain('confidentiel.pdf');
  });

  test("utilisateur non vérifié n'a pas le droit de lister les annexes", async () => {
    const editorCaller = router.createCaller({ user: editorUser });
    const ficheId = await createFiche({
      caller: editorCaller,
      ficheInput: {
        titre: 'Fiche pour test droits',
        collectiviteId: collectivite.id,
      },
    });

    const { user: nonVerifieFixture } = await addTestUser(db, {
      verified: false,
    });
    const nonVerifieUser = getAuthUserFromUserCredentials(nonVerifieFixture);
    const nonVerifieCaller = router.createCaller({ user: nonVerifieUser });

    await expect(
      nonVerifieCaller.plans.fiches.ficheAnnexes({
        collectiviteId: collectivite.id,
        ficheIds: [ficheId],
      })
    ).rejects.toThrowError(/permissions nécessaires/i);
  });
});
