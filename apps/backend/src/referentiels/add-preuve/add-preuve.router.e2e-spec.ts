import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { preuveComplementaireTable } from '@tet/backend/collectivites/documents/models/preuve-complementaire.table';
import { preuveReglementaireTable } from '@tet/backend/collectivites/documents/models/preuve-reglementaire.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';
import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { AuthenticatedUser } from '../../users/models/auth.models';

type AddPreuveReglementaireInput = inferProcedureInput<
  AppRouter['referentiels']['actions']['addPreuveReglementaire']
>;

type AddPreuveComplementaireInput = inferProcedureInput<
  AppRouter['referentiels']['actions']['addPreuveComplementaire']
>;

const PREUVE_REGLEMENTAIRE = {
  preuveId: 'etude_vulnerabiliteCC',
  actionId: 'cae_1.1.3.2',
} as const;

describe('AddPreuveRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let cleanupFixture: (() => Promise<void>) | undefined;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let readerUser: AuthenticatedUser;
  let createdDocumentId: number;

  const insertBibliothequeFichier = async (collectiviteId: number) => {
    const [document] = await databaseService.db
      .insert(bibliothequeFichierTable)
      .values({
        collectiviteId,
        hash: randomUUID().replaceAll('-', ''),
        filename: 'preuve-test.pdf',
        confidentiel: false,
      })
      .returning({ id: bibliothequeFichierTable.id });

    return document.id;
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
    cleanupFixture = fixture.cleanup;

    collectivite = fixture.collectivite;
    editorUser = getAuthUserFromUserCredentials(fixture.users[0]);
    readerUser = getAuthUserFromUserCredentials(fixture.users[1]);

    createdDocumentId = await insertBibliothequeFichier(collectivite.id);
  });

  afterAll(async () => {
    await databaseService.db
      .delete(preuveComplementaireTable)
      .where(eq(preuveComplementaireTable.collectiviteId, collectivite.id));
    await databaseService.db
      .delete(preuveReglementaireTable)
      .where(eq(preuveReglementaireTable.collectiviteId, collectivite.id));
    await cleanupFixture?.();
    await app.close();
  });

  test('un éditeur peut créer une preuve réglementaire depuis la bibliothèque', async () => {
    const caller = router.createCaller({ user: editorUser });

    const result = await caller.referentiels.actions.addPreuveReglementaire({
      collectiviteId: collectivite.id,
      preuveId: PREUVE_REGLEMENTAIRE.preuveId,
      fichierId: createdDocumentId,
      commentaire: '',
    } satisfies AddPreuveReglementaireInput);

    expect(result.id).toEqual(expect.any(Number));

    const [inserted] = await databaseService.db
      .select()
      .from(preuveReglementaireTable)
      .where(
        and(
          eq(preuveReglementaireTable.id, result.id),
          eq(preuveReglementaireTable.collectiviteId, collectivite.id)
        )
      );

    expect(inserted).toMatchObject({
      collectiviteId: collectivite.id,
      preuveId: PREUVE_REGLEMENTAIRE.preuveId,
      fichierId: createdDocumentId,
      commentaire: '',
      modifiedBy: editorUser.id,
    });
  });

  test('un éditeur peut créer une preuve complémentaire avec un lien', async () => {
    const caller = router.createCaller({ user: editorUser });

    const result = await caller.referentiels.actions.addPreuveComplementaire({
      collectiviteId: collectivite.id,
      actionId: PREUVE_REGLEMENTAIRE.actionId,
      lien: {
        url: 'https://example.com/preuve-complementaire',
        titre: 'Preuve complémentaire',
      },
      commentaire: 'Ajout depuis le test',
    } satisfies AddPreuveComplementaireInput);

    expect(result.id).toEqual(expect.any(Number));

    const [inserted] = await databaseService.db
      .select()
      .from(preuveComplementaireTable)
      .where(
        and(
          eq(preuveComplementaireTable.id, result.id),
          eq(preuveComplementaireTable.collectiviteId, collectivite.id)
        )
      );

    expect(inserted).toMatchObject({
      collectiviteId: collectivite.id,
      actionId: PREUVE_REGLEMENTAIRE.actionId,
      url: 'https://example.com/preuve-complementaire',
      titre: 'Preuve complémentaire',
      commentaire: 'Ajout depuis le test',
      modifiedBy: editorUser.id,
    });
  });

  test('un éditeur peut créer une preuve réglementaire avec un lien', async () => {
    const caller = router.createCaller({ user: editorUser });

    const result = await caller.referentiels.actions.addPreuveReglementaire({
      collectiviteId: collectivite.id,
      preuveId: PREUVE_REGLEMENTAIRE.preuveId,
      lien: {
        url: 'https://example.com/preuve-reglementaire',
        titre: 'Preuve réglementaire',
      },
    } satisfies AddPreuveReglementaireInput);

    expect(result.id).toEqual(expect.any(Number));

    const [inserted] = await databaseService.db
      .select()
      .from(preuveReglementaireTable)
      .where(
        and(
          eq(preuveReglementaireTable.id, result.id),
          eq(preuveReglementaireTable.collectiviteId, collectivite.id)
        )
      );

    expect(inserted).toMatchObject({
      collectiviteId: collectivite.id,
      preuveId: PREUVE_REGLEMENTAIRE.preuveId,
      url: 'https://example.com/preuve-reglementaire',
      titre: 'Preuve réglementaire',
      commentaire: '',
      modifiedBy: editorUser.id,
    });
  });

  test('un éditeur peut créer une preuve complémentaire depuis la bibliothèque', async () => {
    const caller = router.createCaller({ user: editorUser });

    const result = await caller.referentiels.actions.addPreuveComplementaire({
      collectiviteId: collectivite.id,
      actionId: PREUVE_REGLEMENTAIRE.actionId,
      fichierId: createdDocumentId,
    } satisfies AddPreuveComplementaireInput);

    expect(result.id).toEqual(expect.any(Number));

    const [inserted] = await databaseService.db
      .select()
      .from(preuveComplementaireTable)
      .where(
        and(
          eq(preuveComplementaireTable.id, result.id),
          eq(preuveComplementaireTable.collectiviteId, collectivite.id)
        )
      );

    expect(inserted).toMatchObject({
      collectiviteId: collectivite.id,
      actionId: PREUVE_REGLEMENTAIRE.actionId,
      fichierId: createdDocumentId,
      titre: '',
      commentaire: '',
      modifiedBy: editorUser.id,
    });
    expect(inserted?.url).toBeNull();
    expect(inserted?.lien).toBeNull();
  });

  test("un éditeur ne peut pas associer un fichier d'une autre collectivité", async () => {
    const autreFixture = await addTestCollectiviteAndUsers(databaseService, {
      users: [{ role: CollectiviteRole.EDITION }],
    });

    const autreDocumentId = await insertBibliothequeFichier(
      autreFixture.collectivite.id
    );

    const caller = router.createCaller({ user: editorUser });

    try {
      await expect(
        caller.referentiels.actions.addPreuveComplementaire({
          collectiviteId: collectivite.id,
          actionId: PREUVE_REGLEMENTAIRE.actionId,
          fichierId: autreDocumentId,
          commentaire: '',
        } satisfies AddPreuveComplementaireInput)
      ).rejects.toThrow(/n'existe pas/i);

      await expect(
        caller.referentiels.actions.addPreuveReglementaire({
          collectiviteId: collectivite.id,
          preuveId: PREUVE_REGLEMENTAIRE.preuveId,
          fichierId: autreDocumentId,
          commentaire: '',
        } satisfies AddPreuveReglementaireInput)
      ).rejects.toThrow(/n'existe pas/i);
    } finally {
      await autreFixture.cleanup();
    }
  });

  test("un éditeur obtient une erreur not found quand l'action n'existe pas", async () => {
    const caller = router.createCaller({ user: editorUser });

    await expect(
      caller.referentiels.actions.addPreuveComplementaire({
        collectiviteId: collectivite.id,
        actionId: 'cae_9.9.9.9',
        fichierId: createdDocumentId,
      } satisfies AddPreuveComplementaireInput)
    ).rejects.toThrow(/n'existe pas/i);
  });

  test("un éditeur obtient une erreur not found quand la preuve réglementaire n'existe pas", async () => {
    const caller = router.createCaller({ user: editorUser });

    await expect(
      caller.referentiels.actions.addPreuveReglementaire({
        collectiviteId: collectivite.id,
        preuveId: 'preuve_inconnue',
        fichierId: createdDocumentId,
      } satisfies AddPreuveReglementaireInput)
    ).rejects.toThrow(/n'existe pas/i);
  });

  test('un lecteur ne peut pas créer une preuve complémentaire', async () => {
    const caller = router.createCaller({ user: readerUser });

    await expect(
      caller.referentiels.actions.addPreuveComplementaire({
        collectiviteId: collectivite.id,
        actionId: PREUVE_REGLEMENTAIRE.actionId,
        fichierId: createdDocumentId,
        commentaire: '',
      } satisfies AddPreuveComplementaireInput)
    ).rejects.toThrow(/permissions nécessaires/i);
  });

  test('un lecteur ne peut pas créer une preuve réglementaire', async () => {
    const caller = router.createCaller({ user: readerUser });

    await expect(
      caller.referentiels.actions.addPreuveReglementaire({
        collectiviteId: collectivite.id,
        preuveId: PREUVE_REGLEMENTAIRE.preuveId,
        fichierId: createdDocumentId,
        commentaire: '',
      } satisfies AddPreuveReglementaireInput)
    ).rejects.toThrow(/permissions nécessaires/i);
  });
});