import { getQueueToken } from '@nestjs/bullmq';
import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { ficheActionSharingTable } from '@tet/backend/plans/fiches/share-fiches/fiche-action-sharing.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
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
import { FICHE_INDEX } from '@tet/backend/plans/fiches/fiche-indexer/fiche-index.constants';
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
  FicheIndexerJobData,
  FicheIndexerService,
  SEARCH_INDEXING_FICHE_QUEUE_NAME,
} from './fiche-indexer.service';

/**
 * E2E pour `FicheIndexerService` (U4).
 *
 * Comme l'e2e du wrapper U1, on saute par défaut si Meilisearch n'est pas
 * disponible (`MEILI_HOST` non défini). Les tests "unitaires" du processeur
 * (chemin d'erreur avec mock + sweep horaire) tournent en revanche
 * inconditionnellement.
 *
 * Les tests les plus critiques portent sur :
 *  - le partage cross-collectivité via `visibleCollectiviteIds` (R4),
 *  - la cascade parent → enfants côté delete,
 *  - le mode `'soft'` qui produit un delete (et non un upsert avec `deleted = true`),
 *  - le sweep horaire qui ré-enfile les partages récents.
 */
const meiliAvailable = Boolean(process.env.MEILI_HOST);

/**
 * Petite aide : on appelle directement `process()` pour ne pas dépendre du
 * timing du worker BullMQ ; les tests restent déterministes même si le
 * worker n'est pas démarré dans l'env de test.
 */
async function processSyncOnce(
  indexer: FicheIndexerService,
  data: FicheIndexerJobData
): Promise<void> {
  const fakeJob = {
    id: `test-${data.op}-${data.entityId}`,
    data,
    attemptsMade: 0,
  } as unknown as Job<FicheIndexerJobData>;
  await indexer.process(fakeJob);
}

describe.skipIf(!meiliAvailable)(
  'FicheIndexerService (e2e, requires MEILI_HOST)',
  () => {
    let app: INestApplication;
    let router: TrpcRouter;
    let db: DatabaseService;
    let indexer: FicheIndexerService;
    let searchIndexer: SearchIndexerService;
    let queue: Queue<FicheIndexerJobData>;
    // Collectivité A : "owner" — fiches y sont créées par défaut.
    let testUserA: AuthenticatedUser;
    let collectiviteAId: number;
    let collectiviteACleanup: () => Promise<void>;
    // Collectivité B : "destinataire" — utilisée pour les tests de partage.
    let collectiviteBId: number;
    let collectiviteBCleanup: () => Promise<void>;
    // IDs créés par chaque test, à nettoyer via Drizzle après coup.
    let createdFicheIds: number[];

    beforeAll(async () => {
      app = await getTestApp();
      router = await getTestRouter(app);
      db = await getTestDatabase(app);
      indexer = app.get(FicheIndexerService);
      searchIndexer = app.get(SearchIndexerService);
      queue = app.get(getQueueToken(SEARCH_INDEXING_FICHE_QUEUE_NAME));

      const colA = await addTestCollectivite(db);
      collectiviteAId = colA.collectivite.id;
      collectiviteACleanup = colA.cleanup;

      const colB = await addTestCollectivite(db);
      collectiviteBId = colB.collectivite.id;
      collectiviteBCleanup = colB.cleanup;

      const userResult = await addTestUser(db);
      testUserA = getAuthUserFromUserCredentials(userResult.user);
      // Admin sur la collectivité A pour pouvoir créer / partager.
      await setUserCollectiviteRole(db, {
        userId: userResult.user.id,
        collectiviteId: collectiviteAId,
        role: CollectiviteRole.ADMIN,
      });
      // L'utilisateur a aussi besoin d'un rôle sur B pour valider les
      // recherches côté collectivité destinataire (rôle minimal LECTURE
      // suffit pour la modale globale).
      await setUserCollectiviteRole(db, {
        userId: userResult.user.id,
        collectiviteId: collectiviteBId,
        role: CollectiviteRole.LECTURE,
      });

      createdFicheIds = [];
    });

    afterAll(async () => {
      // Best-effort : on nettoie les docs Meilisearch des deux collectivités
      // de test pour ne pas polluer un index "fiches" partagé en CI.
      try {
        await searchIndexer.bulkDelete(FICHE_INDEX, {
          filter: `visibleCollectiviteIds IN [${collectiviteAId}, ${collectiviteBId}]`,
        });
      } catch {
        // ignore
      }
      if (createdFicheIds.length > 0) {
        await db.db
          .delete(ficheActionTable)
          .where(inArray(ficheActionTable.id, createdFicheIds));
      }
      await collectiviteACleanup?.();
      await collectiviteBCleanup?.();
      await app.close();
    });

    test("crée une fiche → upsert enfilé → doc indexé avec visibleCollectiviteIds = [A], parentId = null", async () => {
      const caller = router.createCaller({ user: testUserA });
      const uniqueTitle = `Fiche test ${Date.now()}`;

      const fiche = await caller.plans.fiches.create({
        fiche: { collectiviteId: collectiviteAId, titre: uniqueTitle },
      });
      createdFicheIds.push(fiche.id);

      await processSyncOnce(indexer, { op: 'upsert', entityId: fiche.id });

      const result = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: FICHE_INDEX,
            q: uniqueTitle,
            filter: `visibleCollectiviteIds = ${collectiviteAId}`,
            limit: 5,
          },
        ],
      });
      const hits = result.results[0].hits as Array<{
        id: number;
        titre: string;
        parentId: number | null;
        visibleCollectiviteIds: number[];
      }>;
      const found = hits.find((h) => h.id === fiche.id);
      expect(found?.titre).toBe(uniqueTitle);
      expect(found?.parentId).toBeNull();
      expect(found?.visibleCollectiviteIds).toEqual([collectiviteAId]);
    });

    test("crée une sous-fiche (avec parentId) → doc indexé avec parentId = <parent>", async () => {
      const caller = router.createCaller({ user: testUserA });

      const parent = await caller.plans.fiches.create({
        fiche: { collectiviteId: collectiviteAId, titre: 'Parent' },
      });
      createdFicheIds.push(parent.id);
      const childTitle = `Sous-fiche ${Date.now()}`;
      const child = await caller.plans.fiches.create({
        fiche: {
          collectiviteId: collectiviteAId,
          titre: childTitle,
          parentId: parent.id,
        },
      });
      createdFicheIds.push(child.id);

      await processSyncOnce(indexer, { op: 'upsert', entityId: child.id });

      const result = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: FICHE_INDEX,
            q: childTitle,
            filter: `visibleCollectiviteIds = ${collectiviteAId}`,
            limit: 5,
          },
        ],
      });
      const hits = result.results[0].hits as Array<{
        id: number;
        parentId: number | null;
      }>;
      const found = hits.find((h) => h.id === child.id);
      expect(found?.parentId).toBe(parent.id);
    });

    test("met à jour le titre d'une fiche → réindexe le nouveau titre", async () => {
      const caller = router.createCaller({ user: testUserA });
      const initialTitle = `Avant ${Date.now()}`;
      const updatedTitle = `${initialTitle} - rev2`;

      const fiche = await caller.plans.fiches.create({
        fiche: { collectiviteId: collectiviteAId, titre: initialTitle },
      });
      createdFicheIds.push(fiche.id);
      await processSyncOnce(indexer, { op: 'upsert', entityId: fiche.id });

      await caller.plans.fiches.update({
        ficheId: fiche.id,
        ficheFields: { titre: updatedTitle },
      });
      await processSyncOnce(indexer, { op: 'upsert', entityId: fiche.id });

      const result = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: FICHE_INDEX,
            q: updatedTitle,
            filter: `visibleCollectiviteIds = ${collectiviteAId}`,
            limit: 5,
          },
        ],
      });
      const hits = result.results[0].hits as Array<{
        id: number;
        titre: string;
      }>;
      expect(hits.find((h) => h.id === fiche.id)?.titre).toBe(updatedTitle);
    });

    test("CRITIQUE : partage A→B met à jour visibleCollectiviteIds ; unshare le retire", async () => {
      const caller = router.createCaller({ user: testUserA });
      const uniqueTitle = `Partage ${Date.now()}`;

      const fiche = await caller.plans.fiches.create({
        fiche: { collectiviteId: collectiviteAId, titre: uniqueTitle },
      });
      createdFicheIds.push(fiche.id);
      await processSyncOnce(indexer, { op: 'upsert', entityId: fiche.id });

      // Phase 1 : partage A → B via `update.sharedWithCollectivites`
      await caller.plans.fiches.update({
        ficheId: fiche.id,
        ficheFields: {
          sharedWithCollectivites: [{ id: collectiviteBId }],
        },
      });
      await processSyncOnce(indexer, { op: 'upsert', entityId: fiche.id });

      const sharedResult = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: FICHE_INDEX,
            q: uniqueTitle,
            filter: `visibleCollectiviteIds = ${collectiviteBId}`,
            limit: 5,
          },
        ],
      });
      const sharedHits = sharedResult.results[0].hits as Array<{
        id: number;
        visibleCollectiviteIds: number[];
      }>;
      const sharedFound = sharedHits.find((h) => h.id === fiche.id);
      expect(sharedFound).toBeDefined();
      expect(sharedFound?.visibleCollectiviteIds).toEqual(
        expect.arrayContaining([collectiviteAId, collectiviteBId])
      );

      // Phase 2 : unshare en passant un tableau vide
      await caller.plans.fiches.update({
        ficheId: fiche.id,
        ficheFields: { sharedWithCollectivites: [] },
      });
      await processSyncOnce(indexer, { op: 'upsert', entityId: fiche.id });

      const unsharedResult = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: FICHE_INDEX,
            q: uniqueTitle,
            filter: `visibleCollectiviteIds = ${collectiviteBId}`,
            limit: 5,
          },
        ],
      });
      const unsharedHits = unsharedResult.results[0].hits as Array<{
        id: number;
      }>;
      // La fiche n'est plus visible côté B
      expect(unsharedHits.find((h) => h.id === fiche.id)).toBeUndefined();

      // … mais reste visible côté A (filtre A retourne toujours la fiche)
      const ownerResult = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: FICHE_INDEX,
            q: uniqueTitle,
            filter: `visibleCollectiviteIds = ${collectiviteAId}`,
            limit: 5,
          },
        ],
      });
      const ownerHits = ownerResult.results[0].hits as Array<{
        id: number;
        visibleCollectiviteIds: number[];
      }>;
      const ownerFound = ownerHits.find((h) => h.id === fiche.id);
      expect(ownerFound?.visibleCollectiviteIds).toEqual([collectiviteAId]);
    });

    test('supprime un parent avec 3 enfants → 4 jobs delete enfilés ; tous absents de l\'index après traitement', async () => {
      const caller = router.createCaller({ user: testUserA });
      const parentTitle = `Cascade parent ${Date.now()}`;

      const parent = await caller.plans.fiches.create({
        fiche: { collectiviteId: collectiviteAId, titre: parentTitle },
      });
      createdFicheIds.push(parent.id);

      const childIds: number[] = [];
      for (let i = 0; i < 3; i++) {
        const child = await caller.plans.fiches.create({
          fiche: {
            collectiviteId: collectiviteAId,
            titre: `Enfant ${i} ${Date.now()}`,
            parentId: parent.id,
          },
        });
        childIds.push(child.id);
        createdFicheIds.push(child.id);
      }

      // Indexe parent + enfants
      for (const id of [parent.id, ...childIds]) {
        await processSyncOnce(indexer, { op: 'upsert', entityId: id });
      }

      // Capture les jobs présents avant le delete
      const jobIdsBefore = (
        await queue.getJobs(['waiting', 'active', 'completed', 'delayed'])
      ).map((j) => j.id);

      await caller.plans.fiches.delete({
        ficheId: parent.id,
        deleteMode: 'hard',
      });

      // Vérifie qu'au moins 4 jobs delete ont été enfilés (parent + 3 enfants)
      const jobIdsAfter = (
        await queue.getJobs(['waiting', 'active', 'completed', 'delayed'])
      ).map((j) => j.id);
      const newJobIds = jobIdsAfter.filter((id) => !jobIdsBefore.includes(id));
      const expectedDeleteJobIds = [parent.id, ...childIds].map(
        (id) => `fiches:delete:${id}`
      );
      for (const expected of expectedDeleteJobIds) {
        expect(newJobIds).toContain(expected);
      }

      // Traite les 4 deletes
      for (const id of [parent.id, ...childIds]) {
        await processSyncOnce(indexer, { op: 'delete', entityId: id });
      }

      // Aucun des 4 ids n'est retrouvé dans l'index
      const result = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: FICHE_INDEX,
            filter: `visibleCollectiviteIds = ${collectiviteAId} AND id IN [${[
              parent.id,
              ...childIds,
            ].join(', ')}]`,
            limit: 10,
          },
        ],
      });
      const hits = result.results[0].hits as Array<{ id: number }>;
      expect(hits.length).toBe(0);
    });

    test("soft-delete → enqueue un job delete (pas un upsert)", async () => {
      const caller = router.createCaller({ user: testUserA });
      const uniqueTitle = `Soft ${Date.now()}`;

      const fiche = await caller.plans.fiches.create({
        fiche: { collectiviteId: collectiviteAId, titre: uniqueTitle },
      });
      createdFicheIds.push(fiche.id);
      await processSyncOnce(indexer, { op: 'upsert', entityId: fiche.id });

      const jobIdsBefore = (
        await queue.getJobs(['waiting', 'active', 'completed', 'delayed'])
      ).map((j) => j.id);

      await caller.plans.fiches.delete({
        ficheId: fiche.id,
        deleteMode: 'soft',
      });

      const jobIdsAfter = (
        await queue.getJobs(['waiting', 'active', 'completed', 'delayed'])
      ).map((j) => j.id);
      const newJobIds = jobIdsAfter.filter((id) => !jobIdsBefore.includes(id));
      // Doit contenir un job de delete, pas un upsert
      expect(newJobIds).toContain(`fiches:delete:${fiche.id}`);
      expect(newJobIds).not.toContain(`fiches:upsert:${fiche.id}`);

      // Traite le delete et vérifie que la fiche n'est plus dans l'index
      await processSyncOnce(indexer, { op: 'delete', entityId: fiche.id });
      const result = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: FICHE_INDEX,
            q: uniqueTitle,
            filter: `visibleCollectiviteIds = ${collectiviteAId}`,
            limit: 5,
          },
        ],
      });
      const hits = result.results[0].hits as Array<{ id: number }>;
      expect(hits.find((h) => h.id === fiche.id)).toBeUndefined();
    });

    test("upsert pour une fiche soft-deleted → no-op silencieux (loader filtre deleted = false)", async () => {
      const caller = router.createCaller({ user: testUserA });
      const fiche = await caller.plans.fiches.create({
        fiche: {
          collectiviteId: collectiviteAId,
          titre: `Ghost ${Date.now()}`,
        },
      });
      createdFicheIds.push(fiche.id);
      // Marque la fiche soft-deleted directement en DB
      await db.db
        .update(ficheActionTable)
        .set({ deleted: true })
        .where(eq(ficheActionTable.id, fiche.id));

      // Ne doit pas throw — le loader filtre `deleted = false` et renvoie null.
      await processSyncOnce(indexer, { op: 'upsert', entityId: fiche.id });
    });

    test("sweep horaire ré-enfile les fiches partagées dans la dernière heure", async () => {
      const caller = router.createCaller({ user: testUserA });
      const fiche = await caller.plans.fiches.create({
        fiche: {
          collectiviteId: collectiviteAId,
          titre: `Sweep ${Date.now()}`,
        },
      });
      createdFicheIds.push(fiche.id);

      // Insère manuellement une ligne `fiche_action_sharing` datée d'il y a
      // 30 minutes. On contourne `shareFiche` pour forcer un état où
      // l'enqueue post-partage a "été perdu" : seul le sweep peut alors
      // rattraper le partage.
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      await db.db
        .insert(ficheActionSharingTable)
        .values({
          ficheId: fiche.id,
          collectiviteId: collectiviteBId,
          createdAt: thirtyMinAgo,
        })
        .onConflictDoNothing();

      const jobIdsBefore = (
        await queue.getJobs(['waiting', 'active', 'completed', 'delayed'])
      ).map((j) => j.id);

      // Déclenche manuellement la méthode du cron (elle est annotée `@Cron`
      // mais reste appelable directement comme méthode publique du service).
      await indexer.sharingRecoverySweep();

      const jobIdsAfter = (
        await queue.getJobs(['waiting', 'active', 'completed', 'delayed'])
      ).map((j) => j.id);
      const newJobIds = jobIdsAfter.filter((id) => !jobIdsBefore.includes(id));
      expect(newJobIds).toContain(`fiches:upsert:${fiche.id}`);

      // Cleanup explicite de la ligne sharing pour ne pas polluer les autres
      // tests (la fiche elle-même est nettoyée via `createdFicheIds`).
      await db.db
        .delete(ficheActionSharingTable)
        .where(eq(ficheActionSharingTable.ficheId, fiche.id));
    });

    test('isolation cross-collectivité : une fiche A non partagée n\'est pas trouvable depuis B', async () => {
      const caller = router.createCaller({ user: testUserA });
      const uniqueTitle = `Isolation ${Date.now()}`;

      const fiche = await caller.plans.fiches.create({
        fiche: { collectiviteId: collectiviteAId, titre: uniqueTitle },
      });
      createdFicheIds.push(fiche.id);
      await processSyncOnce(indexer, { op: 'upsert', entityId: fiche.id });

      const result = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: FICHE_INDEX,
            q: uniqueTitle,
            filter: `visibleCollectiviteIds = ${collectiviteBId}`,
            limit: 5,
          },
        ],
      });
      const hits = result.results[0].hits as Array<{ id: number }>;
      expect(hits.find((h) => h.id === fiche.id)).toBeUndefined();
    });

    test("indexAll() réindexe les fiches de la collectivité", async () => {
      const caller = router.createCaller({ user: testUserA });
      const uniqueTitle = `IndexAll ${Date.now()}`;
      const fiche = await caller.plans.fiches.create({
        fiche: { collectiviteId: collectiviteAId, titre: uniqueTitle },
      });
      createdFicheIds.push(fiche.id);

      await indexer.indexAll();

      // Petite latence : Meilisearch traite l'ajout en arrière-plan ; on
      // poll jusqu'à 2.5 s.
      let foundLast = false;
      for (let attempt = 0; attempt < 10; attempt++) {
        const result = await searchIndexer.multiSearch({
          queries: [
            {
              indexUid: FICHE_INDEX,
              filter: `visibleCollectiviteIds = ${collectiviteAId} AND id = ${fiche.id}`,
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
    }, 30_000);
  }
);

/**
 * Tests "unitaires" du processeur : pas de dépendance Meilisearch live.
 * On stubbe `SearchIndexerService` pour valider la classification d'erreur.
 */
describe('FicheIndexerService.process error handling (unit, mocked)', () => {
  function makeDatabaseStub(rows: unknown[]) {
    // Drizzle chain : `.select(...).from(...).where(...).limit(N)` doit
    // renvoyer la liste de lignes pour le loader principal, et
    // `.select(...).from(...).where(...)` (sans `.limit`) pour les sharings.
    return {
      db: {
        select: () => ({
          from: () => ({
            where: () => {
              const promiseLike = Promise.resolve(rows);
              return Object.assign(promiseLike, {
                limit: async () => rows,
              });
            },
          }),
        }),
      },
    } as unknown as DatabaseService;
  }

  test('une erreur Meilisearch permanente est wrappée en UnrecoverableError', async () => {
    const databaseStub = makeDatabaseStub([
      {
        id: 1,
        collectiviteId: 42,
        titre: 'Fiche test',
        description: null,
        parentId: null,
      },
    ]);

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
      addBulk: vi.fn(),
    } as unknown as Queue<FicheIndexerJobData>;

    const indexer = new FicheIndexerService(
      databaseStub,
      searchIndexerStub,
      queueStub
    );

    const job = {
      id: 'test-job',
      data: { op: 'upsert' as const, entityId: 1 },
      attemptsMade: 0,
    } as unknown as Job<FicheIndexerJobData>;

    await expect(indexer.process(job)).rejects.toBeInstanceOf(
      UnrecoverableError
    );
    expect(upsertSpy).toHaveBeenCalledOnce();
  });

  test('une erreur Meilisearch retryable est ré-throw telle quelle', async () => {
    const databaseStub = makeDatabaseStub([
      {
        id: 1,
        collectiviteId: 42,
        titre: 'Fiche test',
        description: null,
        parentId: null,
      },
    ]);

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
    } as unknown as Queue<FicheIndexerJobData>;

    const indexer = new FicheIndexerService(
      databaseStub,
      searchIndexerStub,
      queueStub
    );

    const job = {
      id: 'test-job',
      data: { op: 'upsert' as const, entityId: 1 },
      attemptsMade: 0,
    } as unknown as Job<FicheIndexerJobData>;

    await expect(indexer.process(job)).rejects.toBe(transientError);
  });

  test('un upsert sur une fiche soft-deleted ou absente est un no-op', async () => {
    const databaseStub = makeDatabaseStub([]); // loader renvoie [] → null

    const upsertSpy = vi.fn();
    const searchIndexerStub = {
      upsert: upsertSpy,
      delete: vi.fn(),
      bulkUpsert: vi.fn(),
    } as unknown as SearchIndexerService;
    const queueStub = {
      add: vi.fn(),
      addBulk: vi.fn(),
    } as unknown as Queue<FicheIndexerJobData>;

    const indexer = new FicheIndexerService(
      databaseStub,
      searchIndexerStub,
      queueStub
    );

    const job = {
      id: 'test-job',
      data: { op: 'upsert' as const, entityId: 999 },
      attemptsMade: 0,
    } as unknown as Job<FicheIndexerJobData>;

    await indexer.process(job);
    expect(upsertSpy).not.toHaveBeenCalled();
  });
});
