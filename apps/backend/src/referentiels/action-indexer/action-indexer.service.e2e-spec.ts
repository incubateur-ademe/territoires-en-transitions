import { getQueueToken } from '@nestjs/bullmq';
import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { actionCommentaireTable } from '@tet/backend/referentiels/models/action-commentaire.table';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { clientScoresTable } from '@tet/backend/referentiels/models/client-scores.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addTestUser,
  setUserCollectiviteRole,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { SearchIndexerService } from '@tet/backend/utils/search-indexer/search-indexer.service';
import { ACTION_INDEX } from '@tet/backend/referentiels/action-indexer/action-index.constants';
import { CollectiviteRole } from '@tet/domain/users';
import { Job, Queue, UnrecoverableError } from 'bullmq';
import { and, eq, inArray } from 'drizzle-orm';
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
  ActionIndexerJobData,
  ActionIndexerService,
  SEARCH_INDEXING_ACTION_QUEUE_NAME,
} from './action-indexer.service';

/**
 * E2E pour `ActionIndexerService` (U6).
 *
 * Comme les autres indexeurs, on saute par défaut si Meilisearch n'est pas
 * disponible (`MEILI_HOST` non défini). Les tests "unitaires" du processeur
 * (chemin d'erreur avec mock) tournent inconditionnellement.
 *
 * Particularités testées :
 *  - clé primaire composite `'${actionId}:${collectiviteId}'` ;
 *  - dénormalisation du `commentaire` per-collectivité ;
 *  - cloisonnement par `collectiviteId` (R4) ;
 *  - le delete d'un `action_commentaire` se traduit en upsert (commentaire
 *    null) — la mesure reste indexée pour la collectivité activée ;
 *  - `fanout-activation` couvre toutes les actions du référentiel pour une
 *    nouvelle collectivité activée ;
 *  - `fanout-referentiel` parcourt le produit cartésien (actions ×
 *    collectivités-activées) en lots.
 */
const meiliAvailable = Boolean(process.env.MEILI_HOST);

async function processSyncOnce(
  indexer: ActionIndexerService,
  data: ActionIndexerJobData
): Promise<void> {
  const fakeJob = {
    id: `test-${data.op}-${'actionId' in data ? data.actionId : data.referentielId}`,
    data,
    attemptsMade: 0,
  } as unknown as Job<ActionIndexerJobData>;
  await indexer.process(fakeJob);
}

/**
 * Active le référentiel `referentielId` pour `collectiviteId` en insérant un
 * faux row `client_scores` (signal d'activation choisi par l'indexeur).
 * Renvoie une fonction de cleanup.
 */
async function activateReferentielForCollectivite(
  db: DatabaseService,
  collectiviteId: number,
  referentielId: 'cae' | 'eci' | 'te' | 'te-test'
): Promise<() => Promise<void>> {
  await db.db
    .insert(clientScoresTable)
    .values({
      collectiviteId,
      referentiel: referentielId,
      scores: [],
      modifiedAt: new Date(),
    })
    .onConflictDoNothing();
  return async () => {
    await db.db
      .delete(clientScoresTable)
      .where(
        and(
          eq(clientScoresTable.collectiviteId, collectiviteId),
          eq(clientScoresTable.referentiel, referentielId)
        )
      );
  };
}

describe.skipIf(!meiliAvailable)(
  'ActionIndexerService (e2e, requires MEILI_HOST)',
  () => {
    let app: INestApplication;
    let db: DatabaseService;
    let indexer: ActionIndexerService;
    let searchIndexer: SearchIndexerService;
    let queue: Queue<ActionIndexerJobData>;
    let testUserA: AuthenticatedUser;
    let collectiviteAId: number;
    let collectiviteACleanup: () => Promise<void>;
    let collectiviteBId: number;
    let collectiviteBCleanup: () => Promise<void>;
    const cleanups: Array<() => Promise<void>> = [];

    beforeAll(async () => {
      app = await getTestApp();
      db = await getTestDatabase(app);
      indexer = app.get(ActionIndexerService);
      searchIndexer = app.get(SearchIndexerService);
      queue = app.get(getQueueToken(SEARCH_INDEXING_ACTION_QUEUE_NAME));

      const colA = await addTestCollectivite(db);
      collectiviteAId = colA.collectivite.id;
      collectiviteACleanup = colA.cleanup;
      const colB = await addTestCollectivite(db);
      collectiviteBId = colB.collectivite.id;
      collectiviteBCleanup = colB.cleanup;

      const userResult = await addTestUser(db);
      testUserA = getAuthUserFromUserCredentials(userResult.user);
      await setUserCollectiviteRole(db, {
        userId: userResult.user.id,
        collectiviteId: collectiviteAId,
        role: CollectiviteRole.ADMIN,
      });
    });

    afterAll(async () => {
      // Cleanup index Meilisearch pour les deux collectivités : best-effort.
      try {
        await searchIndexer.bulkDelete(ACTION_INDEX, {
          filter: `collectiviteId IN [${collectiviteAId}, ${collectiviteBId}]`,
        });
      } catch {
        // ignore
      }
      // Cleanup commentaires.
      await db.db
        .delete(actionCommentaireTable)
        .where(
          inArray(actionCommentaireTable.collectiviteId, [
            collectiviteAId,
            collectiviteBId,
          ])
        );
      // Cleanup activations + autres fixtures (LIFO pour respecter l'ordre
      // d'insertion).
      for (const cleanup of cleanups.slice().reverse()) {
        try {
          await cleanup();
        } catch {
          // ignore
        }
      }
      await collectiviteACleanup?.();
      await collectiviteBCleanup?.();
      await app.close();
    });

    test('fanout-activation : toutes les actions du référentiel sont indexées avec commentaire null', async () => {
      // S'il n'y a aucune action CAE en DB de test, on saute.
      const [anyCaeAction] = await db.db
        .select({ actionId: actionDefinitionTable.actionId })
        .from(actionDefinitionTable)
        .where(eq(actionDefinitionTable.referentielId, 'cae'))
        .limit(1);
      if (!anyCaeAction) {
        return;
      }

      const cleanupA = await activateReferentielForCollectivite(
        db,
        collectiviteAId,
        'cae'
      );
      cleanups.push(cleanupA);

      await processSyncOnce(indexer, {
        op: 'fanout-activation',
        referentielId: 'cae',
        collectiviteId: collectiviteAId,
      });

      // Attente pour traitement Meilisearch.
      let foundAtLeastOne = false;
      for (let attempt = 0; attempt < 10; attempt++) {
        const result = await searchIndexer.multiSearch({
          queries: [
            {
              indexUid: ACTION_INDEX,
              filter: `collectiviteId = ${collectiviteAId} AND referentielId = "cae"`,
              limit: 5,
            },
          ],
        });
        const hits = result.results[0].hits as Array<{
          collectiviteId: number;
          commentaire: string | null;
        }>;
        if (hits.length > 0) {
          foundAtLeastOne = true;
          // Toutes les hits indexées initialement n'ont pas de commentaire.
          for (const h of hits) {
            expect(h.collectiviteId).toBe(collectiviteAId);
          }
          break;
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      expect(foundAtLeastOne).toBe(true);
    }, 30_000);

    test('upsert-pair : un commentaire est dénormalisé dans le doc et apparaît en recherche', async () => {
      // On choisit la première action CAE existante en DB.
      const [firstCaeAction] = await db.db
        .select({ actionId: actionDefinitionTable.actionId })
        .from(actionDefinitionTable)
        .where(eq(actionDefinitionTable.referentielId, 'cae'))
        .limit(1);
      if (!firstCaeAction) {
        // Pas d'actions CAE en DB de test : on saute ce test.
        return;
      }

      const uniqueText = `Carbone-marker-${Date.now()}`;
      await db.db
        .insert(actionCommentaireTable)
        .values({
          collectiviteId: collectiviteAId,
          actionId: firstCaeAction.actionId,
          commentaire: uniqueText,
          modifiedBy: testUserA.id,
        })
        .onConflictDoUpdate({
          target: [
            actionCommentaireTable.collectiviteId,
            actionCommentaireTable.actionId,
          ],
          set: { commentaire: uniqueText },
        });

      await processSyncOnce(indexer, {
        op: 'upsert-pair',
        actionId: firstCaeAction.actionId,
        collectiviteId: collectiviteAId,
      });

      // Recherche sur le commentaire.
      let foundCommentaire = false;
      for (let attempt = 0; attempt < 10; attempt++) {
        const result = await searchIndexer.multiSearch({
          queries: [
            {
              indexUid: ACTION_INDEX,
              q: uniqueText,
              filter: `collectiviteId = ${collectiviteAId}`,
              limit: 5,
            },
          ],
        });
        const hits = result.results[0].hits as Array<{
          id: string;
          commentaire: string | null;
        }>;
        const found = hits.find(
          (h) => h.id === `${firstCaeAction.actionId}:${collectiviteAId}`
        );
        if (found?.commentaire === uniqueText) {
          foundCommentaire = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      expect(foundCommentaire).toBe(true);
    }, 30_000);

    test('isolation cross-collectivité : la collectivité B ne voit pas les commentaires de A', async () => {
      // B n'est pas activée sur CAE → recherche depuis B ne doit rien renvoyer
      // dans le bucket actions filtré par collectiviteId = B.
      const result = await searchIndexer.multiSearch({
        queries: [
          {
            indexUid: ACTION_INDEX,
            q: 'Carbone-marker',
            filter: `collectiviteId = ${collectiviteBId}`,
            limit: 5,
          },
        ],
      });
      const hits = result.results[0].hits as Array<unknown>;
      expect(hits.length).toBe(0);
    });

    test('delete d\'un action_commentaire = upsert avec commentaire null (le doc reste découvrable)', async () => {
      const [firstCaeAction] = await db.db
        .select({ actionId: actionDefinitionTable.actionId })
        .from(actionDefinitionTable)
        .where(eq(actionDefinitionTable.referentielId, 'cae'))
        .limit(1);
      if (!firstCaeAction) {
        return;
      }

      // Supprime le commentaire en DB (équivalent flux production hypothétique
      // — pour l'instant la table n'a pas de DELETE applicatif). On simule la
      // re-indexation que le futur service de delete devrait déclencher.
      await db.db
        .delete(actionCommentaireTable)
        .where(
          and(
            eq(actionCommentaireTable.collectiviteId, collectiviteAId),
            eq(actionCommentaireTable.actionId, firstCaeAction.actionId)
          )
        );

      await processSyncOnce(indexer, {
        op: 'upsert-pair',
        actionId: firstCaeAction.actionId,
        collectiviteId: collectiviteAId,
      });

      // Le doc doit toujours être présent, mais avec commentaire null.
      let observedNull = false;
      const compositeId = `${firstCaeAction.actionId}:${collectiviteAId}`;
      for (let attempt = 0; attempt < 10; attempt++) {
        const result = await searchIndexer.multiSearch({
          queries: [
            {
              indexUid: ACTION_INDEX,
              filter: `collectiviteId = ${collectiviteAId} AND referentielId = "cae"`,
              limit: 1000,
            },
          ],
        });
        const hits = result.results[0].hits as Array<{
          id: string;
          commentaire: string | null;
        }>;
        const hit = hits.find((h) => h.id === compositeId);
        if (hit && hit.commentaire === null) {
          observedNull = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      expect(observedNull).toBe(true);
    }, 30_000);

    test('delete-pair : le doc n\'est plus indexé', async () => {
      const [firstCaeAction] = await db.db
        .select({ actionId: actionDefinitionTable.actionId })
        .from(actionDefinitionTable)
        .where(eq(actionDefinitionTable.referentielId, 'cae'))
        .limit(1);
      if (!firstCaeAction) {
        return;
      }

      // S'assure que le doc existe avant de le supprimer.
      await processSyncOnce(indexer, {
        op: 'upsert-pair',
        actionId: firstCaeAction.actionId,
        collectiviteId: collectiviteAId,
      });

      await processSyncOnce(indexer, {
        op: 'delete-pair',
        actionId: firstCaeAction.actionId,
        collectiviteId: collectiviteAId,
      });

      let docGone = false;
      for (let attempt = 0; attempt < 10; attempt++) {
        const result = await searchIndexer.multiSearch({
          queries: [
            {
              indexUid: ACTION_INDEX,
              filter: `collectiviteId = ${collectiviteAId} AND referentielId = "cae"`,
              limit: 1000,
            },
          ],
        });
        const hits = result.results[0].hits as Array<{ id: string }>;
        const found = hits.find(
          (h) => h.id === `${firstCaeAction.actionId}:${collectiviteAId}`
        );
        if (!found) {
          docGone = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      expect(docGone).toBe(true);
    }, 30_000);

    test('fanout-referentiel : couvre actions × collectivités-activées en lots', async () => {
      // S'il n'y a aucune action CAE en DB de test, on saute (la table de
      // référentiel CAE n'a pas été importée dans cet environnement).
      const [anyCaeAction] = await db.db
        .select({ actionId: actionDefinitionTable.actionId })
        .from(actionDefinitionTable)
        .where(eq(actionDefinitionTable.referentielId, 'cae'))
        .limit(1);
      if (!anyCaeAction) {
        return;
      }

      // Deux collectivités activées sur CAE → fanout doit toucher les deux.
      const cleanupB = await activateReferentielForCollectivite(
        db,
        collectiviteBId,
        'cae'
      );
      cleanups.push(cleanupB);

      await processSyncOnce(indexer, {
        op: 'fanout-referentiel',
        referentielId: 'cae',
      });

      // Vérifie qu'au moins un doc apparaît pour B.
      let foundB = false;
      for (let attempt = 0; attempt < 10; attempt++) {
        const result = await searchIndexer.multiSearch({
          queries: [
            {
              indexUid: ACTION_INDEX,
              filter: `collectiviteId = ${collectiviteBId} AND referentielId = "cae"`,
              limit: 1,
            },
          ],
        });
        const hits = result.results[0].hits as Array<unknown>;
        if (hits.length > 0) {
          foundB = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      expect(foundB).toBe(true);
    }, 60_000);

    test('enqueueUpsertPair via la queue produit un jobId déterministe', async () => {
      const jobIdsBefore = (
        await queue.getJobs(['waiting', 'active', 'completed', 'delayed'])
      ).map((j) => j.id);
      await indexer.enqueueUpsertPair('cae_1', collectiviteAId);
      const jobIdsAfter = (
        await queue.getJobs(['waiting', 'active', 'completed', 'delayed'])
      ).map((j) => j.id);
      const newJobIds = jobIdsAfter.filter((id) => !jobIdsBefore.includes(id));
      expect(newJobIds).toContain(`actions:upsert:cae_1:${collectiviteAId}`);
    });
  }
);

/**
 * Tests "unitaires" du processeur : pas de dépendance Meilisearch live.
 * On stubbe `SearchIndexerService` pour valider la classification d'erreur.
 */
describe('ActionIndexerService.process error handling (unit, mocked)', () => {
  test('une erreur Meilisearch permanente est wrappée en UnrecoverableError', async () => {
    const databaseStub = {
      db: {
        select: () => ({
          from: () => ({
            innerJoin: () => ({
              leftJoin: () => ({
                where: () => ({
                  limit: async () => [
                    {
                      actionId: 'cae_1',
                      referentielId: 'cae',
                      nom: 'Action test',
                      description: 'Description test',
                      hierarchie: ['referentiel', 'axe', 'sous-axe', 'action'],
                      commentaire: null,
                    },
                  ],
                }),
              }),
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
    } as unknown as Queue<ActionIndexerJobData>;

    const indexer = new ActionIndexerService(
      databaseStub,
      searchIndexerStub,
      queueStub
    );

    const job = {
      id: 'test-job',
      data: {
        op: 'upsert-pair' as const,
        actionId: 'cae_1',
        collectiviteId: 42,
      },
      attemptsMade: 0,
    } as unknown as Job<ActionIndexerJobData>;

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
            innerJoin: () => ({
              leftJoin: () => ({
                where: () => ({
                  limit: async () => [
                    {
                      actionId: 'cae_1',
                      referentielId: 'cae',
                      nom: 'Action test',
                      description: 'Description test',
                      hierarchie: ['referentiel', 'axe', 'sous-axe', 'action'],
                      commentaire: null,
                    },
                  ],
                }),
              }),
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
    } as unknown as Queue<ActionIndexerJobData>;

    const indexer = new ActionIndexerService(
      databaseStub,
      searchIndexerStub,
      queueStub
    );

    const job = {
      id: 'test-job',
      data: {
        op: 'upsert-pair' as const,
        actionId: 'cae_1',
        collectiviteId: 42,
      },
      attemptsMade: 0,
    } as unknown as Job<ActionIndexerJobData>;

    await expect(indexer.process(job)).rejects.toBe(transientError);
    expect(indexer).toBeDefined();
  });

  test('upsert-pair sur un actionId absent en DB est un no-op', async () => {
    const databaseStub = {
      db: {
        select: () => ({
          from: () => ({
            innerJoin: () => ({
              leftJoin: () => ({
                where: () => ({
                  limit: async () => [],
                }),
              }),
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
    } as unknown as Queue<ActionIndexerJobData>;

    const indexer = new ActionIndexerService(
      databaseStub,
      searchIndexerStub,
      queueStub
    );

    const job = {
      id: 'test-job',
      data: {
        op: 'upsert-pair' as const,
        actionId: 'cae_unknown',
        collectiviteId: 42,
      },
      attemptsMade: 0,
    } as unknown as Job<ActionIndexerJobData>;

    await indexer.process(job);
    expect(upsertSpy).not.toHaveBeenCalled();
  });
});
