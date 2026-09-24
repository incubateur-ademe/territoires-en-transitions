import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { seedTestDocument } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { preuveRapportTable } from '@tet/backend/collectivites/documents/models/preuve-rapport.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite, PreuveRapport } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { AddRapportVisiteInput } from './add-rapport-visite.input';

const DATE_VISITE = '2026-01-15';
const DATE_VISITE_STORED = '2026-01-15T00:00:00.000Z';

describe('AddRapportVisiteRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let readerUser: AuthenticatedUser;
  let fichierId: number;

  const seedFichierBibliotheque = async (
    collectiviteId: number
  ): Promise<number> => {
    const document = await seedTestDocument({
      databaseService,
      collectiviteId,
      filename: 'rapport-visite-test.pdf',
      withStorageObject: false,
    });

    return document.id;
  };

  const postAsUntypedClient = (
    user: AuthenticatedUser,
    payload: Record<string, unknown>
  ): Promise<PreuveRapport> =>
    router
      .createCaller({ user })
      .collectivites.documents.addRapportVisite(
        payload as AddRapportVisiteInput
      );

  const countRapportsVisite = async (
    collectiviteId: number
  ): Promise<number> => {
    const rapports = await databaseService.db
      .select({ id: preuveRapportTable.id })
      .from(preuveRapportTable)
      .where(eq(preuveRapportTable.collectiviteId, collectiviteId));

    return rapports.length;
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const fixture = await addTestCollectiviteAndUsers(databaseService, {
      users: [
        { role: CollectiviteRole.EDITION },
        { role: CollectiviteRole.LECTURE },
      ],
    });

    collectivite = fixture.collectivite;
    editorUser = getAuthUserFromUserCredentials(fixture.users[0]);
    readerUser = getAuthUserFromUserCredentials(fixture.users[1]);

    fichierId = await seedFichierBibliotheque(collectivite.id);

    return async () => {
      await databaseService.db
        .delete(preuveRapportTable)
        .where(eq(preuveRapportTable.collectiviteId, collectivite.id));
      await fixture.cleanup();
      await app.close();
    };
  });

  test('un éditeur peut déposer un rapport de visite depuis la bibliothèque', async () => {
    const caller = router.createCaller({ user: editorUser });

    const rapport = await caller.collectivites.documents.addRapportVisite({
      collectiviteId: collectivite.id,
      date: DATE_VISITE,
      fichierId,
      commentaire: 'Visite annuelle',
    });

    expect(rapport).toMatchObject({
      id: expect.any(Number),
      collectiviteId: collectivite.id,
      fichierId,
      commentaire: 'Visite annuelle',
      date: DATE_VISITE_STORED,
      modifiedBy: editorUser.id,
      url: null,
      titre: '',
      lien: null,
    });
  });

  test('un éditeur peut déposer un rapport de visite sous forme de lien', async () => {
    const caller = router.createCaller({ user: editorUser });

    const rapport = await caller.collectivites.documents.addRapportVisite({
      collectiviteId: collectivite.id,
      date: DATE_VISITE,
      lien: {
        url: 'https://example.com/rapport-visite',
        titre: 'Rapport de visite',
      },
    });

    expect(rapport).toMatchObject({
      id: expect.any(Number),
      collectiviteId: collectivite.id,
      fichierId: null,
      url: 'https://example.com/rapport-visite',
      titre: 'Rapport de visite',
      commentaire: '',
      date: DATE_VISITE_STORED,
      modifiedBy: editorUser.id,
      lien: {
        url: 'https://example.com/rapport-visite',
        titre: 'Rapport de visite',
      },
    });
  });

  test("un dépôt portant à la fois un fichier et un lien est refusé et n'écrit rien", async () => {
    const rapportCountBefore = await countRapportsVisite(collectivite.id);

    await expect(
      postAsUntypedClient(editorUser, {
        collectiviteId: collectivite.id,
        date: DATE_VISITE,
        fichierId,
        lien: {
          url: 'https://example.com/rapport-visite',
          titre: 'Rapport de visite',
        },
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    await expect(countRapportsVisite(collectivite.id)).resolves.toBe(
      rapportCountBefore
    );
  });

  test("un éditeur ne peut pas déposer le fichier d'une autre collectivité", async () => {
    const otherFixture = await addTestCollectiviteAndUsers(databaseService, {
      users: [{ role: CollectiviteRole.EDITION }],
    });
    onTestFinished(otherFixture.cleanup);
    const otherFichierId = await seedFichierBibliotheque(
      otherFixture.collectivite.id
    );

    const caller = router.createCaller({ user: editorUser });
    const rapportCountBefore = await countRapportsVisite(collectivite.id);

    await expect(
      caller.collectivites.documents.addRapportVisite({
        collectiviteId: collectivite.id,
        date: DATE_VISITE,
        fichierId: otherFichierId,
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });

    await expect(countRapportsVisite(collectivite.id)).resolves.toBe(
      rapportCountBefore
    );
  });

  test("un éditeur ne peut pas déposer sur une collectivité dont il n'est pas membre", async () => {
    const otherFixture = await addTestCollectiviteAndUsers(databaseService, {
      users: [{ role: CollectiviteRole.EDITION }],
    });
    onTestFinished(async () => {
      await databaseService.db
        .delete(preuveRapportTable)
        .where(
          eq(preuveRapportTable.collectiviteId, otherFixture.collectivite.id)
        );
      await otherFixture.cleanup();
    });
    const otherFichierId = await seedFichierBibliotheque(
      otherFixture.collectivite.id
    );

    const caller = router.createCaller({ user: editorUser });

    await expect(
      caller.collectivites.documents.addRapportVisite({
        collectiviteId: otherFixture.collectivite.id,
        date: DATE_VISITE,
        fichierId: otherFichierId,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    await expect(
      countRapportsVisite(otherFixture.collectivite.id)
    ).resolves.toBe(0);
  });

  test('un lecteur ne peut pas déposer de rapport de visite', async () => {
    const caller = router.createCaller({ user: readerUser });
    const rapportCountBefore = await countRapportsVisite(collectivite.id);

    await expect(
      caller.collectivites.documents.addRapportVisite({
        collectiviteId: collectivite.id,
        date: DATE_VISITE,
        fichierId,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    await expect(countRapportsVisite(collectivite.id)).resolves.toBe(
      rapportCountBefore
    );
  });

  test("un dépôt sans fichier ni lien est refusé et n'écrit rien", async () => {
    const rapportCountBefore = await countRapportsVisite(collectivite.id);

    await expect(
      postAsUntypedClient(editorUser, {
        collectiviteId: collectivite.id,
        date: DATE_VISITE,
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    await expect(countRapportsVisite(collectivite.id)).resolves.toBe(
      rapportCountBefore
    );
  });

  test("un dépôt dont le lien est vide est refusé et n'écrit rien", async () => {
    const rapportCountBefore = await countRapportsVisite(collectivite.id);

    await expect(
      postAsUntypedClient(editorUser, {
        collectiviteId: collectivite.id,
        date: DATE_VISITE,
        lien: { url: '', titre: '' },
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    await expect(countRapportsVisite(collectivite.id)).resolves.toBe(
      rapportCountBefore
    );
  });

  test("un dépôt dont le lien n'est pas une url est refusé et n'écrit rien", async () => {
    const rapportCountBefore = await countRapportsVisite(collectivite.id);

    await expect(
      postAsUntypedClient(editorUser, {
        collectiviteId: collectivite.id,
        date: DATE_VISITE,
        lien: { url: 'example.com/rapport', titre: 'Rapport de visite' },
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    await expect(countRapportsVisite(collectivite.id)).resolves.toBe(
      rapportCountBefore
    );
  });

  test("une date de visite portant une heure est refusée et n'écrit rien", async () => {
    const rapportCountBefore = await countRapportsVisite(collectivite.id);

    await expect(
      postAsUntypedClient(editorUser, {
        collectiviteId: collectivite.id,
        date: '2026-01-15T17:43:12.345Z',
        fichierId,
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    await expect(countRapportsVisite(collectivite.id)).resolves.toBe(
      rapportCountBefore
    );
  });
});
