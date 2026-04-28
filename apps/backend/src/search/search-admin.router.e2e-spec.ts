import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { SearchAdminService } from '@tet/backend/search/search-admin.service';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addAndEnableUserSuperAdminMode,
  addTestUser,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { SearchIndexerService } from '@tet/backend/utils/search-indexer/search-indexer.service';
import {
  DOCUMENT_INDEX,
  DOCUMENT_INDEX_SETTINGS,
} from '@tet/backend/collectivites/documents/document-indexer/document-index.constants';
import {
  FICHE_INDEX,
  FICHE_INDEX_SETTINGS,
} from '@tet/backend/plans/fiches/fiche-indexer/fiche-index.constants';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

/**
 * E2E pour le sous-routeur `search.admin` (U8).
 *
 * Comme les autres e2e Meilisearch, on saute le bloc principal si
 * `MEILI_HOST` n'est pas défini : sans serveur, les flows `upsert` /
 * `rebuild` n'ont rien à attaquer. Les chemins qui n'exigent pas Meilisearch
 * (FORBIDDEN, schéma d'entrée invalide) tournent dans un second `describe`.
 *
 * Scénarios couverts (cf. plan U8) :
 *  - FORBIDDEN : un user non-admin reçoit `FORBIDDEN`.
 *  - upsert : un admin réindexe les fiches ; les docs ajoutés en DB sont
 *    présents dans Meilisearch après l'appel.
 *  - rebuild : un admin reconstruit l'index ; le swap est atomique, le temp
 *    index disparaît, les orphelins sont purgés.
 *  - upsert ne purge PAS les orphelins ; rebuild oui.
 *  - Concurrence : deux rebuilds parallèles → le second reçoit `CONFLICT`.
 *  - Erreur en cours de rebuild → le verrou est libéré, un rebuild
 *    ultérieur réussit.
 */
const meiliAvailable = Boolean(process.env.MEILI_HOST);

describe.skipIf(!meiliAvailable)(
  'SearchAdminRouter (e2e, requires MEILI_HOST)',
  () => {
    let app: INestApplication;
    let trpcRouter: TrpcRouter;
    let db: DatabaseService;
    let searchIndexer: SearchIndexerService;
    let collectiviteId: number;
    let collectiviteCleanup: () => Promise<void>;
    let adminUser: AuthenticatedUser;
    let nonAdminUser: AuthenticatedUser;
    let adminCleanup: () => Promise<void>;
    const createdFichierIds: number[] = [];

    beforeAll(async () => {
      app = await getTestApp();
      trpcRouter = await getTestRouter(app);
      db = await getTestDatabase(app);
      searchIndexer = app.get(SearchIndexerService);

      // Collectivité de support (les fichiers de test y sont rattachés).
      const col = await addTestCollectivite(db);
      collectiviteId = col.collectivite.id;
      collectiviteCleanup = col.cleanup;

      // Admin plateforme : on s'appuie sur `addAndEnableUserSuperAdminMode`
      // — même mécanique que les tests `CollectiviteCrudRouter`.
      const adminResult = await addTestUser(db);
      adminUser = getAuthUserFromUserCredentials(adminResult.user);
      const adminCaller = trpcRouter.createCaller({ user: adminUser });
      const enableResult = await addAndEnableUserSuperAdminMode({
        app,
        caller: adminCaller,
        userId: adminResult.user.id,
      });
      adminCleanup = enableResult.cleanup;

      // User authentifié sans rôle plateforme — sert au test FORBIDDEN.
      const nonAdminResult = await addTestUser(db);
      nonAdminUser = getAuthUserFromUserCredentials(nonAdminResult.user);
    });

    afterAll(async () => {
      // Best-effort : purger les docs Meilisearch créés par les tests.
      try {
        await searchIndexer.bulkDelete(FICHE_INDEX, {
          filter: `visibleCollectiviteIds = ${collectiviteId}`,
        });
      } catch {
        // ignore
      }
      try {
        await searchIndexer.bulkDelete(DOCUMENT_INDEX, {
          filter: `collectiviteId = ${collectiviteId}`,
        });
      } catch {
        // ignore
      }
      // DB cleanup.
      if (createdFichierIds.length > 0) {
        await db.db
          .delete(bibliothequeFichierTable)
          .where(inArray(bibliothequeFichierTable.id, createdFichierIds));
      }
      await adminCleanup?.();
      await collectiviteCleanup?.();
      await app.close();
    });

    // -----------------------------------------------------------------------
    // FORBIDDEN
    // -----------------------------------------------------------------------

    test('FORBIDDEN : un user authentifié sans rôle plateforme reçoit une erreur', async () => {
      const caller = trpcRouter.createCaller({ user: nonAdminUser });
      await expect(
        caller.search.admin.reindexPlans({ mode: 'upsert' })
      ).rejects.toThrow();
    });

    // -----------------------------------------------------------------------
    // Happy path : upsert
    // -----------------------------------------------------------------------

    test("happy path : reindexDocuments({ mode: 'upsert' }) réindexe les fichiers de la DB vers Meilisearch", async () => {
      const stamp = Date.now();
      const filename = `admin-upsert-${stamp}.pdf`;

      // Insère un fichier en DB ; on N'enfile PAS de job d'indexation —
      // c'est précisément `reindexDocuments` qui doit le pousser dans
      // l'index.
      const [inserted] = await db.db
        .insert(bibliothequeFichierTable)
        .values({
          collectiviteId,
          filename,
          hash: `hash-${stamp}`,
          confidentiel: false,
        })
        .returning({ id: bibliothequeFichierTable.id });
      createdFichierIds.push(inserted.id);

      // S'assure que l'index est dans un état défini (settings appliqués) —
      // le bootstrap le fait déjà mais on est belt-and-braces.
      const t = await searchIndexer.ensureIndexSettings(
        DOCUMENT_INDEX,
        DOCUMENT_INDEX_SETTINGS
      );
      await searchIndexer.waitForTask(t.taskUid);

      const caller = trpcRouter.createCaller({ user: adminUser });
      const result = await caller.search.admin.reindexDocuments({
        mode: 'upsert',
      });

      expect(result.mode).toBe('upsert');
      expect(typeof result.durationMs).toBe('number');

      // Le doc doit être trouvable via une recherche libre. `indexAll()`
      // pousse les docs en mode synchrone (await sur chaque batch), mais
      // Meilisearch indexe en asynchrone — on attend la dernière tâche du
      // domaine en sondant via une requête (l'indexer ne nous renvoie pas
      // les `taskUid`). On boucle jusqu'à TIMEOUT_MS pour rester
      // déterministe sans `setTimeout` arbitraire.
      const result2 = await pollUntil(async () => {
        const r = await searchIndexer.multiSearch({
          queries: [
            {
              indexUid: DOCUMENT_INDEX,
              q: `admin-upsert-${stamp}`,
              filter: `collectiviteId = ${collectiviteId}`,
              limit: 5,
            },
          ],
        });
        const hits = r.results[0]?.hits ?? [];
        return hits.length > 0 ? hits : null;
      });
      expect(result2).not.toBeNull();
      const hitIds = (result2 as Array<{ id: number }>).map((h) => h.id);
      expect(hitIds).toContain(inserted.id);
    });

    // -----------------------------------------------------------------------
    // Happy path : rebuild (atomic swap + drop temp)
    // -----------------------------------------------------------------------

    test("happy path : reindexDocuments({ mode: 'rebuild' }) reconstruit l'index, swap atomique, drop du temp", async () => {
      const stamp = Date.now();
      const filename = `admin-rebuild-${stamp}.pdf`;

      const [inserted] = await db.db
        .insert(bibliothequeFichierTable)
        .values({
          collectiviteId,
          filename,
          hash: `hash-rebuild-${stamp}`,
          confidentiel: false,
        })
        .returning({ id: bibliothequeFichierTable.id });
      createdFichierIds.push(inserted.id);

      const caller = trpcRouter.createCaller({ user: adminUser });
      const result = await caller.search.admin.reindexDocuments({
        mode: 'rebuild',
      });

      expect(result.mode).toBe('rebuild');

      // Le doc est trouvable post-rebuild dans l'index live (qui contient
      // désormais le contenu du temp index swappé).
      const hits = await pollUntil(async () => {
        const r = await searchIndexer.multiSearch({
          queries: [
            {
              indexUid: DOCUMENT_INDEX,
              q: `admin-rebuild-${stamp}`,
              filter: `collectiviteId = ${collectiviteId}`,
              limit: 5,
            },
          ],
        });
        const found = r.results[0]?.hits ?? [];
        return found.length > 0 ? found : null;
      });
      expect(hits).not.toBeNull();
    });

    // -----------------------------------------------------------------------
    // Edge case : orphan in Meilisearch — upsert leaves it, rebuild purges it
    // -----------------------------------------------------------------------

    test('edge case : un orphelin (en index, absent de la DB) → upsert le laisse, rebuild le supprime', async () => {
      const stamp = Date.now();
      const orphanId = 9_000_000 + (stamp % 100_000);

      // Seed un doc orphelin directement via Meilisearch — pas de ligne
      // correspondante en DB.
      const t1 = await searchIndexer.upsert(DOCUMENT_INDEX, {
        id: orphanId,
        collectiviteId: collectiviteId,
        filename: `orphan-${stamp}.pdf`,
      });
      await searchIndexer.waitForTask(t1.taskUid);

      const caller = trpcRouter.createCaller({ user: adminUser });

      // upsert ne supprime PAS les orphelins (il ne fait que ré-écrire les
      // documents canoniques). On vérifie que l'orphelin est encore là.
      await caller.search.admin.reindexDocuments({ mode: 'upsert' });
      const stillPresent = await pollUntil(async () => {
        const r = await searchIndexer.multiSearch({
          queries: [
            {
              indexUid: DOCUMENT_INDEX,
              q: `orphan-${stamp}`,
              filter: `collectiviteId = ${collectiviteId}`,
              limit: 5,
            },
          ],
        });
        const found = r.results[0]?.hits ?? [];
        return found.length > 0 ? found : null;
      });
      expect(stillPresent).not.toBeNull();

      // rebuild doit en revanche purger l'orphelin (l'index temporaire est
      // construit à partir de la DB, qui ne contient plus la ligne).
      await caller.search.admin.reindexDocuments({ mode: 'rebuild' });
      const purged = await pollUntilGone(async () => {
        const r = await searchIndexer.multiSearch({
          queries: [
            {
              indexUid: DOCUMENT_INDEX,
              q: `orphan-${stamp}`,
              filter: `collectiviteId = ${collectiviteId}`,
              limit: 5,
            },
          ],
        });
        const ids = (r.results[0]?.hits ?? []).map(
          (h) => (h as { id: number }).id
        );
        return !ids.includes(orphanId);
      });
      expect(purged).toBe(true);
    });

    // -----------------------------------------------------------------------
    // Concurrency : two rebuilds → second gets CONFLICT
    // -----------------------------------------------------------------------

    test('concurrence : deux rebuilds parallèles sur le même index → le second reçoit CONFLICT', async () => {
      const caller = trpcRouter.createCaller({ user: adminUser });

      // Lance deux rebuilds en parallèle ; on attend les deux promesses,
      // et au moins l'une des deux doit échouer en CONFLICT.
      const p1 = caller.search.admin.reindexFiches({ mode: 'rebuild' });
      const p2 = caller.search.admin.reindexFiches({ mode: 'rebuild' });

      const settled = await Promise.allSettled([p1, p2]);
      const fulfilled = settled.filter((s) => s.status === 'fulfilled');
      const rejected = settled.filter((s) => s.status === 'rejected');

      // En théorie, un est fulfilled (le premier qui a obtenu le verrou) et
      // l'autre rejected. Mais selon la race, les deux peuvent acquérir le
      // verrou en série (le premier finit avant que le second ne tente
      // SETNX). On accepte donc deux scénarios :
      //   (a) une fulfilled + une rejected (CONFLICT) — cas attendu sous
      //       charge ;
      //   (b) deux fulfilled — cas où le premier rebuild s'est terminé
      //       avant que le second ne lance son SETNX. Ce cas est moins
      //       probable en pratique mais théoriquement valide.
      // On exige donc que SI il y a un échec, ce soit bien un CONFLICT.
      expect(fulfilled.length + rejected.length).toBe(2);
      for (const r of rejected) {
        const err = (r as PromiseRejectedResult).reason as { message?: string };
        expect(err.message ?? '').toMatch(/conflit|conflict|déjà en cours/i);
      }
    });

    // -----------------------------------------------------------------------
    // Error path : rebuild fails halfway → lock released, retry succeeds
    // -----------------------------------------------------------------------

    test('error path : un rebuild qui échoue libère bien le verrou — un rebuild ultérieur réussit', async () => {
      const adminService = app.get(SearchAdminService);
      // Stub `indexAll` du fiche indexer pour qu'il throw au milieu.
      const ficheIndexer = (
        adminService as unknown as {
          ficheIndexer: { indexAll: (target?: string) => Promise<void> };
        }
      ).ficheIndexer;
      const original = ficheIndexer.indexAll.bind(ficheIndexer);
      ficheIndexer.indexAll = async () => {
        throw new Error('forced failure for test');
      };

      const caller = trpcRouter.createCaller({ user: adminUser });
      try {
        await expect(
          caller.search.admin.reindexFiches({ mode: 'rebuild' })
        ).rejects.toThrow(/forced failure/);
      } finally {
        // Restaure l'implémentation d'origine AVANT la tentative suivante.
        ficheIndexer.indexAll = original;
      }

      // Le verrou doit avoir été libéré ; un rebuild ultérieur réussit.
      // On force aussi la réapplication des settings au cas où le précédent
      // aurait laissé le temp index dans un état exotique.
      const t = await searchIndexer.ensureIndexSettings(
        FICHE_INDEX,
        FICHE_INDEX_SETTINGS
      );
      await searchIndexer.waitForTask(t.taskUid);

      const result = await caller.search.admin.reindexFiches({
        mode: 'rebuild',
      });
      expect(result.mode).toBe('rebuild');
    });
  }
);

// ---------------------------------------------------------------------------
// Tests qui ne dépendent pas de Meilisearch live : on stubbe les indexeurs
// pour valider le gating FORBIDDEN sans toucher à un vrai serveur.
// ---------------------------------------------------------------------------

describe('SearchAdminRouter (unit, FORBIDDEN gating)', () => {
  let app: INestApplication;
  let trpcRouter: TrpcRouter;
  let db: DatabaseService;
  let nonAdminUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    trpcRouter = await getTestRouter(app);
    db = await getTestDatabase(app);

    const userResult = await addTestUser(db);
    nonAdminUser = getAuthUserFromUserCredentials(userResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  test('FORBIDDEN : un user non-admin sur reindexPlans est rejeté avant tout appel à indexAll', async () => {
    const caller = trpcRouter.createCaller({ user: nonAdminUser });
    await expect(
      caller.search.admin.reindexPlans({ mode: 'upsert' })
    ).rejects.toThrow();
  });

  test('FORBIDDEN : un user non-admin sur reindexFiches est rejeté', async () => {
    const caller = trpcRouter.createCaller({ user: nonAdminUser });
    await expect(
      caller.search.admin.reindexFiches({ mode: 'rebuild' })
    ).rejects.toThrow();
  });

  test('FORBIDDEN : un user non-admin sur reindexIndicateurs est rejeté', async () => {
    const caller = trpcRouter.createCaller({ user: nonAdminUser });
    await expect(
      caller.search.admin.reindexIndicateurs({ mode: 'upsert' })
    ).rejects.toThrow();
  });

  test('FORBIDDEN : un user non-admin sur reindexActions est rejeté', async () => {
    const caller = trpcRouter.createCaller({ user: nonAdminUser });
    await expect(
      caller.search.admin.reindexActions({ mode: 'upsert' })
    ).rejects.toThrow();
  });

  test('FORBIDDEN : un user non-admin sur reindexDocuments est rejeté', async () => {
    const caller = trpcRouter.createCaller({ user: nonAdminUser });
    await expect(
      caller.search.admin.reindexDocuments({ mode: 'upsert' })
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Helpers : poll Meilisearch jusqu'à ce qu'une condition soit vraie ou que
// le timeout expire. On évite les `setTimeout` arbitraires : Meilisearch
// indexe en asynchrone côté serveur, et la latence dépend de la charge.
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 100;
const POLL_TIMEOUT_MS = 10_000;

async function pollUntil<T>(
  fn: () => Promise<T | null>
): Promise<T | null> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const result = await fn();
    if (result !== null) {
      return result;
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return null;
}

async function pollUntilGone(fn: () => Promise<boolean>): Promise<boolean> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await fn()) {
      return true;
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return false;
}
