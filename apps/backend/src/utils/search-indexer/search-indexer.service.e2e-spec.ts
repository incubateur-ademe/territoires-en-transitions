import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  FICHE_INDEX,
  FICHE_INDEX_SETTINGS,
} from '@tet/backend/plans/fiches/fiche-indexer/fiche-index.constants';
import {
  PLAN_INDEX,
  PLAN_INDEX_SETTINGS,
} from '@tet/backend/plans/plans/plan-indexer/plan-index.constants';
import { UnrecoverableError } from 'bullmq';
import { MeilisearchApiError, type Task } from 'meilisearch';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import ConfigurationService from '../config/configuration.service';
import {
  MeilisearchTaskFailedError,
  classifyMeilisearchError,
} from './search-error.util';
import { SearchIndexerService } from './search-indexer.service';

/**
 * Construit un `MeilisearchApiError` de test avec le code souhaité dans
 * `err.cause`. Le SDK pose le code dans le payload de réponse parsé
 * (`MeilisearchErrorResponse`) que le constructeur stocke comme `cause` —
 * pas directement sur l'erreur. On simule une `Response` HTTP 4xx pour
 * matcher la signature `new MeilisearchApiError(response, body)`.
 */
function makeMeilisearchApiError(
  code: string,
  message = `test error: ${code}`
): MeilisearchApiError {
  const response = new Response('{}', { status: 400 });
  return new MeilisearchApiError(response, {
    message,
    code,
    type: 'invalid_request',
    link: '',
  });
}

/**
 * Construit un `Task` de test en état terminal (typiquement `failed`),
 * utilisé pour vérifier le comportement de `MeilisearchTaskFailedError`
 * sans avoir besoin d'une instance Meilisearch live.
 */
function makeFailedTask(code: string, message = `task failed: ${code}`): Task {
  return {
    uid: 42,
    indexUid: 'test_index',
    status: 'failed',
    type: 'documentAdditionOrUpdate',
    enqueuedAt: '2026-04-28T00:00:00.000Z',
    startedAt: '2026-04-28T00:00:01.000Z',
    finishedAt: '2026-04-28T00:00:02.000Z',
    duration: 'PT1S',
    canceledBy: null,
    batchUid: null,
    error: {
      message,
      code,
      type: 'invalid_request',
      link: '',
    },
  };
}

/**
 * E2E pour le wrapper Meilisearch.
 *
 * Ces tests s'exécutent uniquement quand un serveur Meilisearch est
 * disponible : on les saute par défaut si `MEILI_HOST` n'est pas défini dans
 * l'env. L'opérateur configurera l'env de test (CI + local) dans une étape
 * de suivi : voir le plan U1.
 *
 * Les indexes utilisés par les tests sont préfixés `_test_` pour ne pas
 * polluer les indexes réels en cas de partage du serveur Meilisearch.
 */
const meiliAvailable = Boolean(process.env.MEILI_HOST);

const TEST_PLAN_INDEX = `_test_${PLAN_INDEX}_${process.pid}`;
const TEST_FICHE_INDEX = `_test_${FICHE_INDEX}_${process.pid}`;
const TEST_PLAN_INDEX_SWAP = `_test_${PLAN_INDEX}_swap_${process.pid}`;

describe.skipIf(!meiliAvailable)('SearchIndexerService (e2e)', () => {
  let service: SearchIndexerService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ ignoreEnvFile: true })],
      providers: [ConfigurationService, SearchIndexerService],
    }).compile();

    service = moduleRef.get(SearchIndexerService);

    // Applique les réglages d'index de test ; appel idempotent.
    const t1 = await service.ensureIndexSettings(
      TEST_PLAN_INDEX,
      PLAN_INDEX_SETTINGS
    );
    await service.waitForTask(t1.taskUid);
    const t2 = await service.ensureIndexSettings(
      TEST_FICHE_INDEX,
      FICHE_INDEX_SETTINGS
    );
    await service.waitForTask(t2.taskUid);
  });

  afterAll(async () => {
    // Best-effort cleanup — ne pas faire échouer le test si l'index
    // a déjà été supprimé par un test précédent.
    await Promise.allSettled([
      service.bulkDelete(TEST_PLAN_INDEX, { filter: 'collectivite_id >= 0' }),
      service.bulkDelete(TEST_FICHE_INDEX, {
        filter: 'visible_collectivite_ids IN [0,1,2,3,4,5,6,7,8,9]',
      }),
    ]);
  });

  describe('health', () => {
    it('renvoie un statut "available" sur un serveur sain', async () => {
      const status = await service.health();
      expect(status.status).toBe('available');
    });
  });

  describe('upsert / delete round-trip', () => {
    it('insère un document puis le supprime', async () => {
      const doc = {
        id: 1,
        collectivite_id: 42,
        nom: 'Plan climat',
        parent_id: null,
      };

      const upsertTask = await service.upsert(TEST_PLAN_INDEX, doc);
      await service.waitForTask(upsertTask.taskUid);

      const deleteTask = await service.delete(TEST_PLAN_INDEX, 1);
      await service.waitForTask(deleteTask.taskUid);
    });
  });

  describe('multiSearch', () => {
    it('renvoie deux buckets pour deux requêtes', async () => {
      // Seed deux index avec un document chacun
      const planTask = await service.upsert(TEST_PLAN_INDEX, {
        id: 100,
        collectivite_id: 42,
        nom: 'Plan vélo',
        parent_id: null,
      });
      const ficheTask = await service.upsert(TEST_FICHE_INDEX, {
        id: 200,
        titre: 'Fiche vélo',
        description: null,
        parent_id: null,
        visible_collectivite_ids: [42],
      });
      await service.waitForTask(planTask.taskUid);
      await service.waitForTask(ficheTask.taskUid);

      const result = await service.multiSearch({
        queries: [
          { indexUid: TEST_PLAN_INDEX, q: 'vélo', limit: 5 },
          { indexUid: TEST_FICHE_INDEX, q: 'vélo', limit: 5 },
        ],
      });

      expect(result.results).toHaveLength(2);
      expect(result.results[0].hits.length).toBeGreaterThanOrEqual(1);
      expect(result.results[1].hits.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('swapIndexes', () => {
    it('échange deux index de manière atomique', async () => {
      // Crée un index "swap" avec un document distinct
      const settingsTask = await service.ensureIndexSettings(
        TEST_PLAN_INDEX_SWAP,
        PLAN_INDEX_SETTINGS
      );
      await service.waitForTask(settingsTask.taskUid);
      const seedTask = await service.upsert(TEST_PLAN_INDEX_SWAP, {
        id: 999,
        collectivite_id: 42,
        nom: 'Plan post-swap',
        parent_id: null,
      });
      await service.waitForTask(seedTask.taskUid);

      const swapTask = await service.swapIndexes([
        { indexes: [TEST_PLAN_INDEX, TEST_PLAN_INDEX_SWAP] },
      ]);
      await service.waitForTask(swapTask.taskUid);
      // L'absence d'erreur suffit ; un test plus poussé vérifierait le
      // contenu de chaque index post-swap, mais c'est testé en U8 (rebuild).
    });
  });

  describe('ensureIndexSettings', () => {
    it("crée un index neuf et est un no-op sur un index déjà configuré", async () => {
      const freshIndex = `_test_fresh_${process.pid}_${Date.now()}`;
      const t1 = await service.ensureIndexSettings(
        freshIndex,
        PLAN_INDEX_SETTINGS
      );
      await service.waitForTask(t1.taskUid);
      // Réapplication : doit aussi réussir (idempotent côté Meilisearch).
      const t2 = await service.ensureIndexSettings(
        freshIndex,
        PLAN_INDEX_SETTINGS
      );
      await service.waitForTask(t2.taskUid);
    });
  });

  describe('bulkUpsert', () => {
    it('découpe >500 documents en lots', async () => {
      const docs = Array.from({ length: 1200 }, (_, i) => ({
        id: 10_000 + i,
        collectivite_id: 1,
        nom: `Plan #${i}`,
        parent_id: null,
      }));

      const tasks = await service.bulkUpsert(TEST_PLAN_INDEX, docs, {
        batchSize: 500,
      });

      // 1200 / 500 = 3 lots (500 + 500 + 200).
      expect(tasks).toHaveLength(3);
      // Cleanup.
      const del = await service.bulkDelete(
        TEST_PLAN_INDEX,
        docs.map((d) => d.id)
      );
      await service.waitForTask(del.taskUid);
    });

    it('renvoie un tableau vide pour une liste vide (pas d\'appel HTTP)', async () => {
      const tasks = await service.bulkUpsert(TEST_PLAN_INDEX, []);
      expect(tasks).toEqual([]);
    });
  });

  describe('classifyMeilisearchError', () => {
    it("transforme un filtre invalide en UnrecoverableError", async () => {
      let caught: unknown;
      try {
        await service.bulkDelete(TEST_PLAN_INDEX, {
          filter: 'this is not a valid meilisearch filter',
        });
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeDefined();
      const classified = classifyMeilisearchError(caught);
      expect(classified).toBeInstanceOf(UnrecoverableError);
    });
  });
});

/**
 * Tests d'unité pour le classifieur d'erreurs : pas de dépendance Meilisearch,
 * exécutés inconditionnellement.
 */
describe('classifyMeilisearchError (unit)', () => {
  it('renvoie UnrecoverableError pour un code permanent connu (MeilisearchApiError)', () => {
    const err = makeMeilisearchApiError('invalid_api_key');
    expect(classifyMeilisearchError(err)).toBeInstanceOf(UnrecoverableError);
  });

  it('renvoie UnrecoverableError pour un code permanent par préfixe (invalid_settings_*)', () => {
    const err = makeMeilisearchApiError(
      'invalid_settings_searchable_attributes'
    );
    expect(classifyMeilisearchError(err)).toBeInstanceOf(UnrecoverableError);
  });

  it('renvoie UnrecoverableError pour un code permanent par préfixe (immutable_*)', () => {
    const err = makeMeilisearchApiError('immutable_index_uid');
    expect(classifyMeilisearchError(err)).toBeInstanceOf(UnrecoverableError);
  });

  it("renvoie l'erreur d'origine pour un MeilisearchApiError retryable (remote_timeout)", () => {
    const err = makeMeilisearchApiError('remote_timeout');
    expect(classifyMeilisearchError(err)).toBe(err);
    expect(classifyMeilisearchError(err)).not.toBeInstanceOf(
      UnrecoverableError
    );
  });

  it("renvoie l'erreur d'origine pour une panne réseau sans MeilisearchApiError", () => {
    const err = new Error('ECONNREFUSED');
    expect(classifyMeilisearchError(err)).toBe(err);
  });

  it("renvoie l'erreur d'origine pour too_many_search_requests (retryable)", () => {
    const err = makeMeilisearchApiError('too_many_search_requests');
    expect(classifyMeilisearchError(err)).toBe(err);
    expect(classifyMeilisearchError(err)).not.toBeInstanceOf(
      UnrecoverableError
    );
  });

  it("ignore un Error avec un .code top-level (ce n'est pas le shape Meilisearch)", () => {
    // Avant le refactor, `classifyMeilisearchError` était dupé par n'importe
    // quelle Error portant un champ `.code`. Aujourd'hui seule
    // `MeilisearchApiError` (avec `cause.code`) déclenche la classification ;
    // toute autre Error est retryable par défaut.
    const err = Object.assign(new Error('not a meili error'), {
      code: 'invalid_api_key',
    });
    expect(classifyMeilisearchError(err)).toBe(err);
    expect(classifyMeilisearchError(err)).not.toBeInstanceOf(
      UnrecoverableError
    );
  });

  it('renvoie UnrecoverableError pour MeilisearchTaskFailedError avec code permanent', () => {
    // Une tâche async finie en `failed` doit traverser la même chaîne de
    // classification qu'une erreur HTTP synchrone — c'est ce qui permet
    // qu'un mauvais filtre côté task ne soit pas retenté en boucle par
    // BullMQ.
    const err = new MeilisearchTaskFailedError(
      makeFailedTask('invalid_filter')
    );
    expect(classifyMeilisearchError(err)).toBeInstanceOf(UnrecoverableError);
  });

  it("renvoie l'erreur d'origine pour MeilisearchTaskFailedError avec code retryable", () => {
    const err = new MeilisearchTaskFailedError(makeFailedTask('internal'));
    expect(classifyMeilisearchError(err)).toBe(err);
    expect(classifyMeilisearchError(err)).not.toBeInstanceOf(
      UnrecoverableError
    );
  });

  it('expose la cause structurée du Task sur MeilisearchTaskFailedError', () => {
    const err = new MeilisearchTaskFailedError(
      makeFailedTask('invalid_document_id', 'doc id "abc!" is invalid')
    );
    expect(err.cause).toEqual({
      message: 'doc id "abc!" is invalid',
      code: 'invalid_document_id',
      type: 'invalid_request',
      link: '',
    });
    expect(err.taskUid).toBe(42);
    expect(err.taskStatus).toBe('failed');
    expect(err.message).toContain('invalid_document_id');
    expect(err.message).toContain('doc id "abc!" is invalid');
  });
});

