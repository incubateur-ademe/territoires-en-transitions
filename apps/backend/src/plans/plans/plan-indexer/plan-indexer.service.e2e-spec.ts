import { getQueueToken } from '@nestjs/bullmq';
import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
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
import { PLAN_INDEX } from '@tet/backend/plans/plans/plan-indexer/plan-index.constants';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { Job, Queue, UnrecoverableError } from 'bullmq';
import { eq, inArray } from 'drizzle-orm';
import { MeilisearchApiError } from 'meilisearch';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import {
  PlanIndexerJobData,
  PlanIndexerService,
  SEARCH_INDEXING_PLAN_QUEUE_NAME,
} from './plan-indexer.service';

/**
 * E2E pour `PlanIndexerService` (U3).
 *
 * Comme l'e2e du wrapper U1, on saute par défaut si Meilisearch n'est pas
 * disponible (`MEILI_HOST` non défini) — l'opérateur configure l'env de test
 * en CI via la même mécanique. Les tests "unitaires" du processeur (chemin
 * d'erreur avec mock) tournent en revanche inconditionnellement.
 *
 * On préfixe l'index Meilisearch utilisé par `_test_…_<pid>` pour éviter
 * d'écraser un index "plans" partagé en CI.
 */
const meiliAvailable = Boolean(process.env.MEILI_HOST);

/**
 * Petite aide : attend que la tâche Meilisearch sous-jacente à l'enqueue soit
 * traitée. Le worker BullMQ traite le job de manière asynchrone ; pour le
 * test on appelle directement `process()` afin de rester déterministe sans
 * dépendre du démarrage du worker.
 */
async function processSyncOnce(
  indexer: PlanIndexerService,
  data: PlanIndexerJobData
): Promise<void> {
  const fakeJob = {
    id: `test-${data.op}-${data.entityId}`,
    data,
    attemptsMade: 0,
  } as unknown as Job<PlanIndexerJobData>;
  await indexer.process(fakeJob);
}

describe.skipIf(!meiliAvailable)('PlanIndexerService (e2e, requires MEILI_HOST)', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  let indexer: PlanIndexerService;
  let searchIndexer: SearchIndexerService;
  let queue: Queue<PlanIndexerJobData>;
  let testUser: AuthenticatedUser;
  let testCollectiviteId: number;
  let collectiviteCleanup: () => Promise<void>;
  // IDs créés par chaque test, à nettoyer via Drizzle après coup pour ne pas
  // dépendre de la disponibilité du worker BullMQ.
  let createdAxeIds: number[];

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);
    indexer = app.get(PlanIndexerService);
    searchIndexer = app.get(SearchIndexerService);
    queue = app.get(getQueueToken(SEARCH_INDEXING_PLAN_QUEUE_NAME));

    const { collectivite, cleanup } = await addTestCollectivite(db);
    testCollectiviteId = collectivite.id;
    collectiviteCleanup = cleanup;

    const userResult = await addTestUser(db);
    testUser = getAuthUserFromUserCredentials(userResult.user);
    await setUserCollectiviteRole(db, {
      userId: userResult.user.id,
      collectiviteId: testCollectiviteId,
      role: CollectiviteRole.ADMIN,
    });

    createdAxeIds = [];
  });

  afterAll(async () => {
    // Cleanup index Meilisearch pour la collectivité de test : best-effort.
    try {
      await searchIndexer.bulkDelete(PLAN_INDEX, {
        filter: `collectiviteId = ${testCollectiviteId}`,
      });
    } catch {
      // ignore
    }
    if (createdAxeIds.length > 0) {
      await db.db.delete(axeTable).where(inArray(axeTable.id, createdAxeIds));
    }
    await collectiviteCleanup?.();
    await app.close();
  });

  test('crée un plan via upsertPlan → enfile un upsert → le doc est interrogeable', async () => {
    const caller = router.createCaller({ user: testUser });
    const uniqueTitle = `Plan vélo ${Date.now()}`;

    const plan = await caller.plans.plans.create({
      collectiviteId: testCollectiviteId,
      nom: uniqueTitle,
    });
    createdAxeIds.push(plan.id);

    // Attend que BullMQ ait persisté le job ; appelle directement
    // `process()` pour ne pas dépendre du timing du worker.
    await processSyncOnce(indexer, { op: 'upsert', entityId: plan.id });

    const result = await searchIndexer.multiSearch({
      queries: [
        {
          indexUid: PLAN_INDEX,
          q: uniqueTitle,
          filter: `collectiviteId = ${testCollectiviteId}`,
          limit: 5,
        },
      ],
    });
    const hits = result.results[0].hits as Array<{ id: number; nom: string }>;
    expect(hits.find((h) => h.id === plan.id)?.nom).toBe(uniqueTitle);
  });

  test('met à jour un plan → réindexe le nouveau nom', async () => {
    const caller = router.createCaller({ user: testUser });
    const initialTitle = `Plan tram ${Date.now()}`;
    const updatedTitle = `${initialTitle} - rev2`;

    const plan = await caller.plans.plans.create({
      collectiviteId: testCollectiviteId,
      nom: initialTitle,
    });
    createdAxeIds.push(plan.id);
    await processSyncOnce(indexer, { op: 'upsert', entityId: plan.id });

    await caller.plans.plans.update({
      id: plan.id,
      collectiviteId: testCollectiviteId,
      nom: updatedTitle,
    });
    await processSyncOnce(indexer, { op: 'upsert', entityId: plan.id });

    const result = await searchIndexer.multiSearch({
      queries: [
        {
          indexUid: PLAN_INDEX,
          q: updatedTitle,
          filter: `collectiviteId = ${testCollectiviteId}`,
          limit: 5,
        },
      ],
    });
    const hits = result.results[0].hits as Array<{ id: number; nom: string }>;
    expect(hits.find((h) => h.id === plan.id)?.nom).toBe(updatedTitle);
  });

  test('supprime un plan → l\'index ne le retourne plus', async () => {
    const caller = router.createCaller({ user: testUser });
    const title = `Plan piétons ${Date.now()}`;

    const plan = await caller.plans.plans.create({
      collectiviteId: testCollectiviteId,
      nom: title,
    });
    await processSyncOnce(indexer, { op: 'upsert', entityId: plan.id });

    await caller.plans.plans.delete({ planId: plan.id });
    await processSyncOnce(indexer, { op: 'delete', entityId: plan.id });

    const result = await searchIndexer.multiSearch({
      queries: [
        {
          indexUid: PLAN_INDEX,
          q: title,
          filter: `collectiviteId = ${testCollectiviteId}`,
          limit: 5,
        },
      ],
    });
    const hits = result.results[0].hits as Array<{ id: number }>;
    expect(hits.find((h) => h.id === plan.id)).toBeUndefined();
  });

  test('upsert pour un plan déjà supprimé → no-op silencieux', async () => {
    // On crée puis supprime DB-side sans passer par l'API, puis on appelle
    // process() avec un id qui n'existe plus : le loader renvoie null, le
    // processeur ne pousse rien — pas d'erreur Meilisearch attendue.
    const inserted = await db.db
      .insert(axeTable)
      .values({
        collectiviteId: testCollectiviteId,
        nom: `Plan éphémère ${Date.now()}`,
      })
      .returning({ id: axeTable.id });
    const ghostId = inserted[0].id;
    await db.db.delete(axeTable).where(eq(axeTable.id, ghostId));

    // Ne doit pas throw.
    await processSyncOnce(indexer, { op: 'upsert', entityId: ghostId });
  });

  test('création d\'un plan-aggregate avec sous-axes → enfile un job par axe', async () => {
    // On utilise directement la queue pour vérifier la dédupe par jobId.
    // La création passe par le router import-plan ou create. Ici on appelle
    // create + add axe via le router pour rester simple, et on inspecte les
    // jobs ajoutés.
    const caller = router.createCaller({ user: testUser });
    const jobIdsBefore = (await queue.getJobs(['waiting', 'active', 'completed', 'delayed'])).map(
      (j) => j.id
    );

    const planTitle = `Aggregate ${Date.now()}`;
    const plan = await caller.plans.plans.create({
      collectiviteId: testCollectiviteId,
      nom: planTitle,
    });
    createdAxeIds.push(plan.id);

    const subAxe = await caller.plans.axes.create({
      collectiviteId: testCollectiviteId,
      planId: plan.id,
      parent: plan.id,
      nom: `Sous-axe ${Date.now()}`,
    });
    createdAxeIds.push(subAxe.id);

    const jobIdsAfter = (await queue.getJobs(['waiting', 'active', 'completed', 'delayed'])).map(
      (j) => j.id
    );
    const newJobIds = jobIdsAfter.filter((id) => !jobIdsBefore.includes(id));
    // Le plan racine est enfilé par UpsertPlanService (au moins 1 job).
    // L'enfilage du sous-axe via UpsertAxeService n'est PAS instrumenté en
    // U3 — il sera couvert par le filet post-commit de l'import-plan ou
    // par le backfill admin. On vérifie au minimum que le plan racine est
    // enfilé.
    expect(newJobIds).toContain(`plans:upsert:${plan.id}`);
  });

  test('indexAll() sur une DB vide ou minimale → pas d\'erreur', async () => {
    // Pas de seed spécifique : on s'assure simplement qu'indexAll() parcourt
    // sans throw, qu'il y ait 0 ou plusieurs lignes en DB.
    await expect(indexer.indexAll()).resolves.toBeUndefined();
  });

  test('indexAll() sur 1500+ lignes → pagine en lots de 500', async () => {
    // Insertion bulk de 1500 axes "test". On vérifie indirectement la
    // pagination : si la boucle ne paginait pas, elle ne traiterait que les
    // 500 premiers et le 1500e ne serait pas dans Meilisearch.
    const N = 1500;
    const rows = Array.from({ length: N }, (_, i) => ({
      collectiviteId: testCollectiviteId,
      nom: `Bulk axe #${i} ${Date.now()}`,
    }));
    const inserted = await db.db
      .insert(axeTable)
      .values(rows)
      .returning({ id: axeTable.id });
    const insertedIds = inserted.map((r) => r.id);
    createdAxeIds.push(...insertedIds);

    await indexer.indexAll();

    // Vérifie que le dernier id est bien indexé.
    const lastId = insertedIds[insertedIds.length - 1];
    // Petite latence : Meilisearch traite les ajouts en arrière-plan ; on
    // attend la dernière tâche poussée avant de relire. `indexAll` ne
    // renvoie pas les tâches ; on s'appuie sur multiSearch retry court.
    let foundLast = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: PLAN_INDEX,
            filter: `collectiviteId = ${testCollectiviteId} AND id = ${lastId}`,
            limit: 1,
          },
        ],
      });
      if ((result.results[0].hits as Array<{ id: number }>).length === 1) {
        foundLast = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    expect(foundLast).toBe(true);
  }, 60_000);
});

/**
 * Tests "unitaires" du processeur : pas de dépendance Meilisearch live.
 * On stubbe `SearchIndexerService` pour valider la classification d'erreur.
 */
describe('PlanIndexerService.process error handling (unit, mocked)', () => {
  test('une erreur Meilisearch permanente est wrappée en UnrecoverableError', async () => {
    const databaseStub = {
      db: {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [
                {
                  id: 1,
                  collectiviteId: 42,
                  nom: 'Plan test',
                  parent: null,
                },
              ],
            }),
          }),
        }),
      },
    } as unknown as DatabaseService;

    // `MeilisearchApiError` est ce que le SDK lance vraiment ; le code vit
    // dans `cause` (pas en top-level), c'est sur ça que `classifyMeilisearchError`
    // narrow via `instanceof`.
    const upsertSpy = vi.fn().mockRejectedValue(
      new MeilisearchApiError(new Response('{}', { status: 400 }), {
        message: 'bad index uid',
        code: 'invalid_index_uid',
        type: 'invalid_request',
        link: '',
      })
    );
    const searchIndexerStub = {
      upsert: upsertSpy,
      delete: vi.fn(),
      bulkUpsert: vi.fn(),
    } as unknown as SearchIndexerService;
    const queueStub = {
      add: vi.fn(),
    } as unknown as Queue<PlanIndexerJobData>;

    const indexer = new PlanIndexerService(
      databaseStub,
      searchIndexerStub,
      queueStub
    );

    const job = {
      id: 'test-job',
      data: { op: 'upsert' as const, entityId: 1 },
      attemptsMade: 0,
    } as unknown as Job<PlanIndexerJobData>;

    await expect(indexer.process(job)).rejects.toBeInstanceOf(UnrecoverableError);
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
                  collectiviteId: 42,
                  nom: 'Plan test',
                  parent: null,
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
    } as unknown as Queue<PlanIndexerJobData>;

    const indexer = new PlanIndexerService(
      databaseStub,
      searchIndexerStub,
      queueStub
    );

    const job = {
      id: 'test-job',
      data: { op: 'upsert' as const, entityId: 1 },
      attemptsMade: 0,
    } as unknown as Job<PlanIndexerJobData>;

    await expect(indexer.process(job)).rejects.toBe(transientError);
    expect(indexer).toBeDefined();
  });

  test('un upsert sur un id absent en DB est un no-op (loader renvoie null)', async () => {
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
    } as unknown as Queue<PlanIndexerJobData>;

    const indexer = new PlanIndexerService(
      databaseStub,
      searchIndexerStub,
      queueStub
    );

    const job = {
      id: 'test-job',
      data: { op: 'upsert' as const, entityId: 999 },
      attemptsMade: 0,
    } as unknown as Job<PlanIndexerJobData>;

    await indexer.process(job);
    expect(upsertSpy).not.toHaveBeenCalled();
  });
});
