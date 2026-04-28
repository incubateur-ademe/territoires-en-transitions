import { getQueueToken } from '@nestjs/bullmq';
import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addTestUser,
  setUserCollectiviteRole,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { SearchIndexerService } from '@tet/backend/utils/search-indexer/search-indexer.service';
import { INDICATEUR_INDEX } from '@tet/backend/indicateurs/indicateurs/indicateur-indexer/indicateur-index.constants';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { Job, Queue, UnrecoverableError } from 'bullmq';
import { eq, inArray } from 'drizzle-orm';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import {
  IndicateurIndexerJobData,
  IndicateurIndexerService,
  SEARCH_INDEXING_INDICATEUR_QUEUE_NAME,
} from './indicateur-indexer.service';

/**
 * E2E pour `IndicateurIndexerService` (U5).
 *
 * Comme l'e2e du wrapper U1, on saute par défaut si Meilisearch n'est pas
 * disponible (`MEILI_HOST` non défini) — l'opérateur configure l'env de test
 * en CI via la même mécanique. Les tests "unitaires" du processeur (chemin
 * d'erreur avec mock) tournent en revanche inconditionnellement.
 *
 * Les scénarios critiques portent sur :
 *  - la dualité prédéfini (collectiviteId IS NULL) / personnalisé
 *    (collectiviteId = X) ;
 *  - le filtre tenant `(collectiviteId IS NULL OR collectiviteId = X)`
 *    qui détermine la visibilité côté lecture (U7) ;
 *  - le delete d'un indicateur personnalisé qui retire le doc de l'index ;
 *  - le chemin d'erreur permanent → UnrecoverableError.
 */
const meiliAvailable = Boolean(process.env.MEILI_HOST);

/**
 * Petite aide : on appelle directement `process()` pour ne pas dépendre du
 * timing du worker BullMQ ; les tests restent déterministes même si le
 * worker n'est pas démarré dans l'env de test.
 */
async function processSyncOnce(
  indexer: IndicateurIndexerService,
  data: IndicateurIndexerJobData
): Promise<void> {
  const fakeJob = {
    id: `test-${data.op}-${data.entityId}`,
    data,
    attemptsMade: 0,
  } as unknown as Job<IndicateurIndexerJobData>;
  await indexer.process(fakeJob);
}

describe.skipIf(!meiliAvailable)(
  'IndicateurIndexerService (e2e, requires MEILI_HOST)',
  () => {
    let app: INestApplication;
    let router: TrpcRouter;
    let db: DatabaseService;
    let indexer: IndicateurIndexerService;
    let searchIndexer: SearchIndexerService;
    let queue: Queue<IndicateurIndexerJobData>;
    // Collectivité A : créatrice d'indicateurs personnalisés.
    let testUserA: AuthenticatedUser;
    let collectiviteAId: number;
    let collectiviteACleanup: () => Promise<void>;
    // Collectivité B : utilisée pour vérifier l'isolation cross-collectivité.
    let testUserB: AuthenticatedUser;
    let collectiviteBId: number;
    let collectiviteBCleanup: () => Promise<void>;
    // IDs créés par chaque test, à nettoyer via Drizzle après coup.
    let createdIndicateurIds: number[];

    beforeAll(async () => {
      app = await getTestApp();
      router = await getTestRouter(app);
      db = await getTestDatabase(app);
      indexer = app.get(IndicateurIndexerService);
      searchIndexer = app.get(SearchIndexerService);
      queue = app.get(getQueueToken(SEARCH_INDEXING_INDICATEUR_QUEUE_NAME));

      const colA = await addTestCollectivite(db);
      collectiviteAId = colA.collectivite.id;
      collectiviteACleanup = colA.cleanup;

      const colB = await addTestCollectivite(db);
      collectiviteBId = colB.collectivite.id;
      collectiviteBCleanup = colB.cleanup;

      const userAResult = await addTestUser(db);
      testUserA = getAuthUserFromUserCredentials(userAResult.user);
      // Admin sur A pour pouvoir créer des indicateurs personnalisés.
      await setUserCollectiviteRole(db, {
        userId: userAResult.user.id,
        collectiviteId: collectiviteAId,
        role: CollectiviteRole.ADMIN,
      });

      const userBResult = await addTestUser(db);
      testUserB = getAuthUserFromUserCredentials(userBResult.user);
      // Lecture sur B pour pouvoir interroger via le proxy (utilisé
      // indirectement ici via les filtres Meilisearch).
      await setUserCollectiviteRole(db, {
        userId: userBResult.user.id,
        collectiviteId: collectiviteBId,
        role: CollectiviteRole.LECTURE,
      });

      createdIndicateurIds = [];
    });

    afterAll(async () => {
      // Best-effort : on nettoie les docs Meilisearch des deux collectivités
      // de test pour ne pas polluer un index "indicateurs" partagé en CI.
      try {
        await searchIndexer.bulkDelete(INDICATEUR_INDEX, {
          filter: `collectiviteId IN [${collectiviteAId}, ${collectiviteBId}]`,
        });
      } catch {
        // ignore
      }
      if (createdIndicateurIds.length > 0) {
        await db.db
          .delete(indicateurDefinitionTable)
          .where(
            inArray(indicateurDefinitionTable.id, createdIndicateurIds)
          );
      }
      await collectiviteACleanup?.();
      await collectiviteBCleanup?.();
      await app.close();
    });

    test("crée un indicateur personnalisé via createIndicateurPerso → enfile un upsert → le doc est interrogeable avec collectiviteId = A et tous les champs U2", async () => {
      const caller = router.createCaller({ user: testUserA });
      const uniqueTitle = `Indicateur perso ${Date.now()}`;

      const indicateurId = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectiviteAId,
        titre: uniqueTitle,
        unite: 'kg',
        thematiques: [],
        commentaire: 'commentaire ignoré dans le doc',
        estFavori: false,
      });
      createdIndicateurIds.push(indicateurId);

      // Capture les jobs présents avant traitement et vérifie qu'un job
      // d'upsert a été enfilé.
      const jobIds = (
        await queue.getJobs(['waiting', 'active', 'completed', 'delayed'])
      ).map((j) => j.id);
      expect(jobIds).toContain(`indicateurs:upsert:${indicateurId}`);

      // Traite directement (déterministe, pas de dépendance au worker)
      await processSyncOnce(indexer, {
        op: 'upsert',
        entityId: indicateurId,
      });

      const result = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: INDICATEUR_INDEX,
            q: uniqueTitle,
            filter: `collectiviteId = ${collectiviteAId}`,
            limit: 5,
          },
        ],
      });
      const hits = result.results[0].hits as Array<{
        id: number;
        identifiantReferentiel: string | null;
        collectiviteId: number | null;
        groupementId: number | null;
        titre: string;
        titreLong: string | null;
        description: string | null;
      }>;
      const found = hits.find((h) => h.id === indicateurId);
      expect(found?.titre).toBe(uniqueTitle);
      expect(found?.collectiviteId).toBe(collectiviteAId);
      // Champs U2 présents (même si nullables) :
      expect(found).toHaveProperty('identifiantReferentiel');
      expect(found).toHaveProperty('groupementId');
      expect(found).toHaveProperty('titreLong');
      expect(found).toHaveProperty('description');
    });

    test("upsert d'un indicateur prédéfini (collectiviteId IS NULL) inséré directement en DB → doc indexé avec collectiviteId null", async () => {
      // L'import `ImportIndicateurDefinitionService` dépend de Google Sheets
      // — pas raisonnable de le tirer dans un e2e. On simule le résultat du
      // chemin d'import en insérant directement une ligne `indicateur_definition`
      // sans `collectiviteId`, puis on appelle l'enqueue + process comme le
      // ferait le service post-commit.
      const uniqueTitle = `Predefined ${Date.now()}`;
      const inserted = await db.db
        .insert(indicateurDefinitionTable)
        .values({
          titre: uniqueTitle,
          unite: 'tCO2',
          identifiantReferentiel: `test_${Date.now()}`,
          // collectiviteId délibérément absent → null = prédéfini
        })
        .returning({ id: indicateurDefinitionTable.id });
      const indicateurId = inserted[0].id;
      createdIndicateurIds.push(indicateurId);

      await indexer.enqueueUpsert(indicateurId);
      await processSyncOnce(indexer, {
        op: 'upsert',
        entityId: indicateurId,
      });

      // Le doc doit être trouvé en filtrant sur `collectiviteId IS NULL`
      // (filtre tenant U7 pour les prédéfinis).
      const result = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: INDICATEUR_INDEX,
            q: uniqueTitle,
            filter: `collectiviteId IS NULL`,
            limit: 5,
          },
        ],
      });
      const hits = result.results[0].hits as Array<{
        id: number;
        collectiviteId: number | null;
      }>;
      const found = hits.find((h) => h.id === indicateurId);
      expect(found).toBeDefined();
      expect(found?.collectiviteId).toBeNull();
    });

    test("supprime un indicateur personnalisé → enfile un delete → le doc disparaît de l'index", async () => {
      const caller = router.createCaller({ user: testUserA });
      const uniqueTitle = `À supprimer ${Date.now()}`;

      const indicateurId = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectiviteAId,
        titre: uniqueTitle,
        unite: 'kg',
        thematiques: [],
        estFavori: false,
      });
      createdIndicateurIds.push(indicateurId);
      await processSyncOnce(indexer, {
        op: 'upsert',
        entityId: indicateurId,
      });

      // Capture les jobs présents avant le delete
      const jobIdsBefore = (
        await queue.getJobs(['waiting', 'active', 'completed', 'delayed'])
      ).map((j) => j.id);

      await caller.indicateurs.indicateurs.delete({
        indicateurId,
        collectiviteId: collectiviteAId,
      });

      // Vérifie qu'un job delete a été enfilé
      const jobIdsAfter = (
        await queue.getJobs(['waiting', 'active', 'completed', 'delayed'])
      ).map((j) => j.id);
      const newJobIds = jobIdsAfter.filter(
        (id) => !jobIdsBefore.includes(id)
      );
      expect(newJobIds).toContain(`indicateurs:delete:${indicateurId}`);

      // Traite le delete et vérifie que le doc n'est plus dans l'index
      await processSyncOnce(indexer, {
        op: 'delete',
        entityId: indicateurId,
      });
      const result = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: INDICATEUR_INDEX,
            q: uniqueTitle,
            filter: `collectiviteId = ${collectiviteAId}`,
            limit: 5,
          },
        ],
      });
      const hits = result.results[0].hits as Array<{ id: number }>;
      expect(hits.find((h) => h.id === indicateurId)).toBeUndefined();
    });

    test("CRITIQUE : isolation cross-collectivité — un indicateur prédéfini est trouvé par A ET B ; un indicateur perso de A est trouvé par A mais pas par B", async () => {
      const callerA = router.createCaller({ user: testUserA });

      // 1) Crée un indicateur prédéfini (global) directement en DB
      const predefinedTitle = `Predefined cross ${Date.now()}`;
      const insertedPredefined = await db.db
        .insert(indicateurDefinitionTable)
        .values({
          titre: predefinedTitle,
          unite: 'tCO2',
          identifiantReferentiel: `test_predef_${Date.now()}`,
        })
        .returning({ id: indicateurDefinitionTable.id });
      const predefinedId = insertedPredefined[0].id;
      createdIndicateurIds.push(predefinedId);
      await indexer.enqueueUpsert(predefinedId);
      await processSyncOnce(indexer, {
        op: 'upsert',
        entityId: predefinedId,
      });

      // 2) Crée un indicateur personnalisé pour A
      const customTitle = `Custom A ${Date.now()}`;
      const customId = await callerA.indicateurs.indicateurs.create({
        collectiviteId: collectiviteAId,
        titre: customTitle,
        unite: 'kg',
        thematiques: [],
        estFavori: false,
      });
      createdIndicateurIds.push(customId);
      await processSyncOnce(indexer, {
        op: 'upsert',
        entityId: customId,
      });

      // 3) A applique son filtre tenant — voit les deux indicateurs
      const aFilter = `(collectiviteId IS NULL OR collectiviteId = ${collectiviteAId})`;
      const aResult = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: INDICATEUR_INDEX,
            filter: `${aFilter} AND id IN [${predefinedId}, ${customId}]`,
            limit: 10,
          },
        ],
      });
      const aHits = aResult.results[0].hits as Array<{ id: number }>;
      expect(aHits.find((h) => h.id === predefinedId)).toBeDefined();
      expect(aHits.find((h) => h.id === customId)).toBeDefined();

      // 4) B applique son filtre tenant — voit le prédéfini, PAS le custom de A
      const bFilter = `(collectiviteId IS NULL OR collectiviteId = ${collectiviteBId})`;
      const bResult = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: INDICATEUR_INDEX,
            filter: `${bFilter} AND id IN [${predefinedId}, ${customId}]`,
            limit: 10,
          },
        ],
      });
      const bHits = bResult.results[0].hits as Array<{ id: number }>;
      expect(bHits.find((h) => h.id === predefinedId)).toBeDefined();
      expect(bHits.find((h) => h.id === customId)).toBeUndefined();
      // Pour faire taire le linter sur `testUserB` non utilisé directement
      // par un caller dans ce scénario : il existe pour valider le setup
      // multi-collectivité (cf. `setUserCollectiviteRole` plus haut).
      expect(testUserB).toBeDefined();
    });

    test("upsert pour un indicateur déjà supprimé → no-op silencieux", async () => {
      // On crée puis supprime DB-side sans passer par l'API, puis on appelle
      // process() avec un id qui n'existe plus : le loader renvoie null, le
      // processeur ne pousse rien — pas d'erreur Meilisearch attendue.
      const inserted = await db.db
        .insert(indicateurDefinitionTable)
        .values({
          titre: `Indicateur éphémère ${Date.now()}`,
          unite: '',
          collectiviteId: collectiviteAId,
        })
        .returning({ id: indicateurDefinitionTable.id });
      const ghostId = inserted[0].id;
      await db.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, ghostId));

      // Ne doit pas throw.
      await processSyncOnce(indexer, { op: 'upsert', entityId: ghostId });
    });

    test("indexAll() sur une DB peuplée → pas d'erreur, parcourt en lots", async () => {
      // Pas de seed massif ici (la table est déjà peuplée par d'autres
      // fixtures). On s'assure simplement qu'indexAll() parcourt sans throw.
      await expect(indexer.indexAll()).resolves.toBeUndefined();
    });
  }
);

/**
 * Tests "unitaires" du processeur : pas de dépendance Meilisearch live.
 * On stubbe `SearchIndexerService` pour valider la classification d'erreur
 * et le no-op sur loader vide.
 */
describe('IndicateurIndexerService.process error handling (unit, mocked)', () => {
  test('une erreur Meilisearch permanente est wrappée en UnrecoverableError', async () => {
    const databaseStub = {
      db: {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [
                {
                  id: 1,
                  identifiantReferentiel: 'cae_1.a',
                  collectiviteId: null,
                  groupementId: null,
                  titre: 'Indicateur test',
                  titreLong: null,
                  description: null,
                },
              ],
            }),
          }),
        }),
      },
    } as unknown as DatabaseService;

    const upsertSpy = vi.fn().mockRejectedValue(
      Object.assign(new Error('bad index uid'), {
        code: 'invalid_index_uid',
      })
    );
    const searchIndexerStub = {
      upsert: upsertSpy,
      delete: vi.fn(),
      bulkUpsert: vi.fn(),
    } as unknown as SearchIndexerService;
    const queueStub = {
      add: vi.fn(),
      addBulk: vi.fn(),
    } as unknown as Queue<IndicateurIndexerJobData>;

    const indexer = new IndicateurIndexerService(
      databaseStub,
      searchIndexerStub,
      queueStub
    );

    const job = {
      id: 'test-job',
      data: { op: 'upsert' as const, entityId: 1 },
      attemptsMade: 0,
    } as unknown as Job<IndicateurIndexerJobData>;

    await expect(indexer.process(job)).rejects.toBeInstanceOf(
      UnrecoverableError
    );
    expect(upsertSpy).toHaveBeenCalledOnce();
  });

  test('une erreur Meilisearch retryable est ré-throw telle quelle', async () => {
    const databaseStub = {
      db: {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [
                {
                  id: 1,
                  identifiantReferentiel: null,
                  collectiviteId: 42,
                  groupementId: null,
                  titre: 'Indicateur test',
                  titreLong: null,
                  description: null,
                },
              ],
            }),
          }),
        }),
      },
    } as unknown as DatabaseService;

    const transientError = Object.assign(new Error('upstream timeout'), {
      code: 'remote_timeout',
    });
    const searchIndexerStub = {
      upsert: vi.fn().mockRejectedValue(transientError),
      delete: vi.fn(),
      bulkUpsert: vi.fn(),
    } as unknown as SearchIndexerService;
    const queueStub = {
      add: vi.fn(),
      addBulk: vi.fn(),
    } as unknown as Queue<IndicateurIndexerJobData>;

    const indexer = new IndicateurIndexerService(
      databaseStub,
      searchIndexerStub,
      queueStub
    );

    const job = {
      id: 'test-job',
      data: { op: 'upsert' as const, entityId: 1 },
      attemptsMade: 0,
    } as unknown as Job<IndicateurIndexerJobData>;

    await expect(indexer.process(job)).rejects.toBe(transientError);
  });

  test("un upsert sur un id absent en DB est un no-op (loader renvoie null)", async () => {
    const databaseStub = {
      db: {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [],
            }),
          }),
        }),
      },
    } as unknown as DatabaseService;

    const upsertSpy = vi.fn();
    const searchIndexerStub = {
      upsert: upsertSpy,
      delete: vi.fn(),
      bulkUpsert: vi.fn(),
    } as unknown as SearchIndexerService;
    const queueStub = {
      add: vi.fn(),
      addBulk: vi.fn(),
    } as unknown as Queue<IndicateurIndexerJobData>;

    const indexer = new IndicateurIndexerService(
      databaseStub,
      searchIndexerStub,
      queueStub
    );

    const job = {
      id: 'test-job',
      data: { op: 'upsert' as const, entityId: 999 },
      attemptsMade: 0,
    } as unknown as Job<IndicateurIndexerJobData>;

    await indexer.process(job);
    expect(upsertSpy).not.toHaveBeenCalled();
  });
});
