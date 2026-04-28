import { getQueueToken } from '@nestjs/bullmq';
import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
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
import { DOCUMENT_INDEX } from '@tet/backend/collectivites/documents/document-indexer/document-index.constants';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { Job, Queue, UnrecoverableError } from 'bullmq';
import { eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import {
  DocumentIndexerJobData,
  DocumentIndexerService,
  SEARCH_INDEXING_DOCUMENT_QUEUE_NAME,
} from './document-indexer.service';

/**
 * E2E pour `DocumentIndexerService` (U12).
 *
 * Comme l'e2e du wrapper U1, on saute par défaut si Meilisearch n'est pas
 * disponible (`MEILI_HOST` non défini) — l'opérateur configure l'env de test
 * en CI via la même mécanique. Les tests "unitaires" du processeur (chemin
 * d'erreur avec mock) tournent en revanche inconditionnellement.
 *
 * Les scénarios critiques portent sur :
 *  - l'upload d'un fichier qui enfile un upsert avec `collectiviteId` et
 *    `filename` corrects ;
 *  - la recherche par sous-chaîne du nom de fichier renvoyant le doc avec un
 *    extrait surligné ;
 *  - le delete qui retire le doc de l'index ;
 *  - l'isolation cross-collectivité (filtre tenant U7) ;
 *  - la visibilité des fichiers globaux (`collectiviteId IS NULL`) ;
 *  - le chemin d'erreur permanent → UnrecoverableError.
 *
 * Note : on insère / supprime directement dans `bibliotheque_fichier` via
 * Drizzle plutôt que de passer par l'upload HTTP — la création de fichier
 * réelle exigerait un bucket Supabase Storage, ce qui n'apporte rien à la
 * vérification du chemin d'indexation. Les tests des services
 * `StoreDocumentService` et `UpdateDocumentService` couvrent l'enqueue depuis
 * l'API d'écriture.
 */
const meiliAvailable = Boolean(process.env.MEILI_HOST);

/**
 * Petite aide : on appelle directement `process()` pour ne pas dépendre du
 * timing du worker BullMQ ; les tests restent déterministes même si le
 * worker n'est pas démarré dans l'env de test.
 */
async function processSyncOnce(
  indexer: DocumentIndexerService,
  data: DocumentIndexerJobData
): Promise<void> {
  const fakeJob = {
    id: `test-${data.op}-${data.entityId}`,
    data,
    attemptsMade: 0,
  } as unknown as Job<DocumentIndexerJobData>;
  await indexer.process(fakeJob);
}

describe.skipIf(!meiliAvailable)(
  'DocumentIndexerService (e2e, requires MEILI_HOST)',
  () => {
    let app: INestApplication;
    let router: TrpcRouter;
    let db: DatabaseService;
    let indexer: DocumentIndexerService;
    let searchIndexer: SearchIndexerService;
    let queue: Queue<DocumentIndexerJobData>;
    // Collectivité A : créatrice de fichiers.
    let testUserA: AuthenticatedUser;
    let collectiviteAId: number;
    let collectiviteACleanup: () => Promise<void>;
    // Collectivité B : utilisée pour vérifier l'isolation cross-collectivité.
    let testUserB: AuthenticatedUser;
    let collectiviteBId: number;
    let collectiviteBCleanup: () => Promise<void>;
    // IDs créés par chaque test, à nettoyer via Drizzle après coup.
    let createdFichierIds: number[];

    beforeAll(async () => {
      app = await getTestApp();
      router = await getTestRouter(app);
      db = await getTestDatabase(app);
      indexer = app.get(DocumentIndexerService);
      searchIndexer = app.get(SearchIndexerService);
      queue = app.get(getQueueToken(SEARCH_INDEXING_DOCUMENT_QUEUE_NAME));

      const colA = await addTestCollectivite(db);
      collectiviteAId = colA.collectivite.id;
      collectiviteACleanup = colA.cleanup;

      const colB = await addTestCollectivite(db);
      collectiviteBId = colB.collectivite.id;
      collectiviteBCleanup = colB.cleanup;

      const userAResult = await addTestUser(db);
      testUserA = getAuthUserFromUserCredentials(userAResult.user);
      // Admin sur A pour pouvoir muter des fichiers.
      await setUserCollectiviteRole(db, {
        userId: userAResult.user.id,
        collectiviteId: collectiviteAId,
        role: CollectiviteRole.ADMIN,
      });

      const userBResult = await addTestUser(db);
      testUserB = getAuthUserFromUserCredentials(userBResult.user);
      await setUserCollectiviteRole(db, {
        userId: userBResult.user.id,
        collectiviteId: collectiviteBId,
        role: CollectiviteRole.LECTURE,
      });

      createdFichierIds = [];
    });

    afterAll(async () => {
      // Best-effort : on nettoie les docs Meilisearch des deux collectivités
      // de test pour ne pas polluer un index "documents" partagé en CI.
      try {
        await searchIndexer.bulkDelete(DOCUMENT_INDEX, {
          filter: `collectiviteId IN [${collectiviteAId}, ${collectiviteBId}]`,
        });
      } catch {
        // ignore
      }
      if (createdFichierIds.length > 0) {
        await db.db
          .delete(bibliothequeFichierTable)
          .where(inArray(bibliothequeFichierTable.id, createdFichierIds));
      }
      await collectiviteACleanup?.();
      await collectiviteBCleanup?.();
      await app.close();
    });

    test("crée un fichier en DB et appelle enqueueUpsert → le doc indexé porte le bon collectiviteId et filename", async () => {
      const uniqueFilename = `rapport-energie-${Date.now()}.pdf`;
      const inserted = await db.db
        .insert(bibliothequeFichierTable)
        .values({
          collectiviteId: collectiviteAId,
          hash: `${Date.now()}aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`.slice(
            0,
            64
          ),
          filename: uniqueFilename,
          confidentiel: false,
        })
        .returning({ id: bibliothequeFichierTable.id });
      const fichierId = inserted[0].id;
      createdFichierIds.push(fichierId);

      await indexer.enqueueUpsert(fichierId);

      // Capture les jobs présents et vérifie qu'un job d'upsert a été enfilé.
      const jobIds = (
        await queue.getJobs(['waiting', 'active', 'completed', 'delayed'])
      ).map((j) => j.id);
      expect(jobIds).toContain(`documents:upsert:${fichierId}`);

      // Traite directement (déterministe, pas de dépendance au worker)
      await processSyncOnce(indexer, { op: 'upsert', entityId: fichierId });

      const result = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: DOCUMENT_INDEX,
            q: uniqueFilename,
            filter: `collectiviteId = ${collectiviteAId}`,
            limit: 5,
          },
        ],
      });
      const hits = result.results[0].hits as Array<{
        id: number;
        collectiviteId: number | null;
        filename: string;
      }>;
      const found = hits.find((h) => h.id === fichierId);
      expect(found).toBeDefined();
      expect(found?.filename).toBe(uniqueFilename);
      expect(found?.collectiviteId).toBe(collectiviteAId);
      // Pour faire taire le linter sur les deps non utilisées dans ce test :
      // `router` et `testUserA` sont configurés en `beforeAll` au cas où un
      // test additionnel passerait par l'API trpc, mais ce premier scénario
      // vérifie le chemin direct DB → indexer.
      expect(router).toBeDefined();
      expect(testUserA).toBeDefined();
    });

    test("recherche par sous-chaîne du filename renvoie le doc avec extrait surligné", async () => {
      const uniqueFilename = `bilan-carbone-${Date.now()}.xlsx`;
      const inserted = await db.db
        .insert(bibliothequeFichierTable)
        .values({
          collectiviteId: collectiviteAId,
          hash: `${Date.now()}bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`.slice(
            0,
            64
          ),
          filename: uniqueFilename,
          confidentiel: false,
        })
        .returning({ id: bibliothequeFichierTable.id });
      const fichierId = inserted[0].id;
      createdFichierIds.push(fichierId);

      await processSyncOnce(indexer, { op: 'upsert', entityId: fichierId });

      // On recherche par une sous-chaîne ("bilan") avec attributs surlignés
      const result = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: DOCUMENT_INDEX,
            q: 'bilan',
            filter: `collectiviteId = ${collectiviteAId}`,
            attributesToHighlight: ['filename'],
            limit: 5,
          },
        ],
      });
      const hits = result.results[0].hits as Array<{
        id: number;
        filename: string;
        _formatted?: { filename: string };
      }>;
      const found = hits.find((h) => h.id === fichierId);
      expect(found).toBeDefined();
      // Le surlignage Meilisearch entoure le terme avec <em>...</em> par défaut.
      expect(found?._formatted?.filename).toBeDefined();
      expect(found?._formatted?.filename).toMatch(/<em>bilan<\/em>/i);
    });

    test("delete d'un fichier → enfile un delete → le doc disparaît de l'index", async () => {
      const uniqueFilename = `a-supprimer-${Date.now()}.pdf`;
      const inserted = await db.db
        .insert(bibliothequeFichierTable)
        .values({
          collectiviteId: collectiviteAId,
          hash: `${Date.now()}ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc`.slice(
            0,
            64
          ),
          filename: uniqueFilename,
          confidentiel: false,
        })
        .returning({ id: bibliothequeFichierTable.id });
      const fichierId = inserted[0].id;
      createdFichierIds.push(fichierId);

      await processSyncOnce(indexer, { op: 'upsert', entityId: fichierId });

      // Capture les jobs présents avant le delete
      const jobIdsBefore = (
        await queue.getJobs(['waiting', 'active', 'completed', 'delayed'])
      ).map((j) => j.id);

      // Suppression DB-side + enqueue delete (il n'existe pas de service de
      // suppression de fichier en production en v1 — on appelle directement
      // l'API de l'indexeur, qui sera utilisée dès qu'un tel service sera
      // ajouté).
      await db.db
        .delete(bibliothequeFichierTable)
        .where(eq(bibliothequeFichierTable.id, fichierId));
      await indexer.enqueueDelete(fichierId);

      const jobIdsAfter = (
        await queue.getJobs(['waiting', 'active', 'completed', 'delayed'])
      ).map((j) => j.id);
      const newJobIds = jobIdsAfter.filter(
        (id) => !jobIdsBefore.includes(id)
      );
      expect(newJobIds).toContain(`documents:delete:${fichierId}`);

      // Traite le delete et vérifie que le doc n'est plus dans l'index
      await processSyncOnce(indexer, { op: 'delete', entityId: fichierId });
      const result = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: DOCUMENT_INDEX,
            q: uniqueFilename,
            filter: `collectiviteId = ${collectiviteAId}`,
            limit: 5,
          },
        ],
      });
      const hits = result.results[0].hits as Array<{ id: number }>;
      expect(hits.find((h) => h.id === fichierId)).toBeUndefined();
    });

    test("CRITIQUE : isolation cross-collectivité — un fichier de A n'est PAS visible de B ; un fichier global (collectiviteId IS NULL) est visible de A ET B", async () => {
      // 1) Fichier de la collectivité A
      const fileAFilename = `secret-a-${Date.now()}.pdf`;
      const insertedA = await db.db
        .insert(bibliothequeFichierTable)
        .values({
          collectiviteId: collectiviteAId,
          hash: `${Date.now()}ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd`.slice(
            0,
            64
          ),
          filename: fileAFilename,
          confidentiel: false,
        })
        .returning({ id: bibliothequeFichierTable.id });
      const fileAId = insertedA[0].id;
      createdFichierIds.push(fileAId);
      await processSyncOnce(indexer, { op: 'upsert', entityId: fileAId });

      // 2) Fichier global (collectiviteId IS NULL)
      const globalFilename = `template-global-${Date.now()}.pdf`;
      const insertedGlobal = await db.db
        .insert(bibliothequeFichierTable)
        .values({
          // collectiviteId délibérément absent → null = fichier global
          hash: `${Date.now()}eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`.slice(
            0,
            64
          ),
          filename: globalFilename,
          confidentiel: false,
        })
        .returning({ id: bibliothequeFichierTable.id });
      const globalId = insertedGlobal[0].id;
      createdFichierIds.push(globalId);
      await processSyncOnce(indexer, { op: 'upsert', entityId: globalId });

      // 3) A applique son filtre tenant — voit le fichier A et le global
      const aFilter = `(collectiviteId IS NULL OR collectiviteId = ${collectiviteAId})`;
      const aResult = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: DOCUMENT_INDEX,
            filter: `${aFilter} AND id IN [${fileAId}, ${globalId}]`,
            limit: 10,
          },
        ],
      });
      const aHits = aResult.results[0].hits as Array<{
        id: number;
        collectiviteId: number | null;
      }>;
      expect(aHits.find((h) => h.id === fileAId)).toBeDefined();
      const aGlobal = aHits.find((h) => h.id === globalId);
      expect(aGlobal).toBeDefined();
      expect(aGlobal?.collectiviteId).toBeNull();

      // 4) B applique son filtre tenant — voit le global, PAS le fichier A
      const bFilter = `(collectiviteId IS NULL OR collectiviteId = ${collectiviteBId})`;
      const bResult = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: DOCUMENT_INDEX,
            filter: `${bFilter} AND id IN [${fileAId}, ${globalId}]`,
            limit: 10,
          },
        ],
      });
      const bHits = bResult.results[0].hits as Array<{
        id: number;
        collectiviteId: number | null;
      }>;
      expect(bHits.find((h) => h.id === fileAId)).toBeUndefined();
      expect(bHits.find((h) => h.id === globalId)).toBeDefined();
      // Pour faire taire le linter sur `testUserB` non utilisé directement
      // dans ce scénario : il existe pour valider le setup multi-collectivité.
      expect(testUserB).toBeDefined();
    });

    test("upsert pour un fichier déjà supprimé → no-op silencieux", async () => {
      const inserted = await db.db
        .insert(bibliothequeFichierTable)
        .values({
          collectiviteId: collectiviteAId,
          hash: `${Date.now()}fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff`.slice(
            0,
            64
          ),
          filename: `ephemere-${Date.now()}.pdf`,
          confidentiel: false,
        })
        .returning({ id: bibliothequeFichierTable.id });
      const ghostId = inserted[0].id;
      await db.db
        .delete(bibliothequeFichierTable)
        .where(eq(bibliothequeFichierTable.id, ghostId));

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
describe('DocumentIndexerService.process error handling (unit, mocked)', () => {
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
                  filename: 'rapport.pdf',
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
    } as unknown as Queue<DocumentIndexerJobData>;

    const indexer = new DocumentIndexerService(
      databaseStub,
      searchIndexerStub,
      queueStub
    );

    const job = {
      id: 'test-job',
      data: { op: 'upsert' as const, entityId: 1 },
      attemptsMade: 0,
    } as unknown as Job<DocumentIndexerJobData>;

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
                  collectiviteId: null,
                  filename: 'global.pdf',
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
    } as unknown as Queue<DocumentIndexerJobData>;

    const indexer = new DocumentIndexerService(
      databaseStub,
      searchIndexerStub,
      queueStub
    );

    const job = {
      id: 'test-job',
      data: { op: 'upsert' as const, entityId: 1 },
      attemptsMade: 0,
    } as unknown as Job<DocumentIndexerJobData>;

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
    } as unknown as Queue<DocumentIndexerJobData>;

    const indexer = new DocumentIndexerService(
      databaseStub,
      searchIndexerStub,
      queueStub
    );

    const job = {
      id: 'test-job',
      data: { op: 'upsert' as const, entityId: 999 },
      attemptsMade: 0,
    } as unknown as Job<DocumentIndexerJobData>;

    await indexer.process(job);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  test("un upsert sur une ligne sans filename est un no-op (loader renvoie null)", async () => {
    const databaseStub = {
      db: {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [
                {
                  id: 1,
                  collectiviteId: 42,
                  filename: null,
                },
              ],
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
    } as unknown as Queue<DocumentIndexerJobData>;

    const indexer = new DocumentIndexerService(
      databaseStub,
      searchIndexerStub,
      queueStub
    );

    const job = {
      id: 'test-job',
      data: { op: 'upsert' as const, entityId: 1 },
      attemptsMade: 0,
    } as unknown as Job<DocumentIndexerJobData>;

    await indexer.process(job);
    expect(upsertSpy).not.toHaveBeenCalled();
  });
});
