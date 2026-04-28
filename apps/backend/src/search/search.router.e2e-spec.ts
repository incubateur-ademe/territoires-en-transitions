import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  SEARCH_RATE_LIMIT_REQUESTS,
  SearchRouter,
} from '@tet/backend/search/search.router';
import { SearchService } from '@tet/backend/search/search.service';
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
import { INDICATEUR_INDEX } from '@tet/backend/indicateurs/indicateurs/indicateur-indexer/indicateur-index.constants';
import { FICHE_INDEX } from '@tet/backend/plans/fiches/fiche-indexer/fiche-index.constants';
import { PLAN_INDEX } from '@tet/backend/plans/plans/plan-indexer/plan-index.constants';
import { ACTION_INDEX } from '@tet/backend/referentiels/action-indexer/action-index.constants';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { inArray } from 'drizzle-orm';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest';

/**
 * E2E pour le proxy de lecture (`SearchRouter` / `SearchService`, U7).
 *
 * Comme les e2e côté indexeur, on saute par défaut si Meilisearch n'est pas
 * disponible (`MEILI_HOST` non défini). Les scénarios qui ne dépendent pas du
 * serveur Meilisearch (Zod, FORBIDDEN, rate-limit, control chars, erreur
 * Meilisearch wrappée) tournent inconditionnellement avec un stub du service.
 *
 * SECURITY-CRITICAL : on insiste particulièrement sur les scénarios
 * d'isolation cross-collectivité (R4) et de gating `accesRestreint`. Ce sont
 * les seuls remparts côté lecture — un bug ici fait fuir des données.
 */
const meiliAvailable = Boolean(process.env.MEILI_HOST);

describe.skipIf(!meiliAvailable)(
  'SearchRouter (e2e, requires MEILI_HOST)',
  () => {
    let app: INestApplication;
    let trpcRouter: TrpcRouter;
    let db: DatabaseService;
    let searchIndexer: SearchIndexerService;
    // Collectivité A : "owner" — fiches/plans/indicateurs y sont créés.
    let testUserA: AuthenticatedUser;
    let collectiviteAId: number;
    let collectiviteACleanup: () => Promise<void>;
    // Collectivité B : "voisine" — pour tester l'isolation cross-collectivité
    // et la cible des partages depuis A.
    let testUserB: AuthenticatedUser;
    let userBOnAOnly: AuthenticatedUser;
    let collectiviteBId: number;
    let collectiviteBCleanup: () => Promise<void>;
    // Collectivité C : confidentielle (`accesRestreint = true`) pour tester
    // le gating `COLLECTIVITES.READ_CONFIDENTIEL`.
    let collectiviteCId: number;
    let collectiviteCCleanup: () => Promise<void>;
    let userWithReadOnC: AuthenticatedUser;
    let userWithoutReadOnC: AuthenticatedUser;
    // IDs créés à nettoyer.
    const createdAxeIds: number[] = [];
    const createdFicheIds: number[] = [];
    const createdIndicateurIds: number[] = [];
    const createdFichierIds: number[] = [];

    beforeAll(async () => {
      app = await getTestApp();
      trpcRouter = await getTestRouter(app);
      db = await getTestDatabase(app);
      searchIndexer = app.get(SearchIndexerService);

      // -- Collectivité A (publique) -------------------------------------
      const colA = await addTestCollectivite(db);
      collectiviteAId = colA.collectivite.id;
      collectiviteACleanup = colA.cleanup;

      // -- Collectivité B (publique) -------------------------------------
      const colB = await addTestCollectivite(db);
      collectiviteBId = colB.collectivite.id;
      collectiviteBCleanup = colB.cleanup;

      // -- Collectivité C (confidentielle) -------------------------------
      const colC = await addTestCollectivite(db, { accesRestreint: true });
      collectiviteCId = colC.collectivite.id;
      collectiviteCCleanup = colC.cleanup;

      // -- Users ---------------------------------------------------------
      // testUserA : ADMIN sur A et B (donc cross-écriture / lecture sur les
      // deux collectivités publiques).
      const userAResult = await addTestUser(db);
      testUserA = getAuthUserFromUserCredentials(userAResult.user);
      await setUserCollectiviteRole(db, {
        userId: userAResult.user.id,
        collectiviteId: collectiviteAId,
        role: CollectiviteRole.ADMIN,
      });
      await setUserCollectiviteRole(db, {
        userId: userAResult.user.id,
        collectiviteId: collectiviteBId,
        role: CollectiviteRole.LECTURE,
      });

      // testUserB : LECTURE sur B (et A pour pouvoir checker partage).
      const userBResult = await addTestUser(db);
      testUserB = getAuthUserFromUserCredentials(userBResult.user);
      await setUserCollectiviteRole(db, {
        userId: userBResult.user.id,
        collectiviteId: collectiviteBId,
        role: CollectiviteRole.LECTURE,
      });

      // userBOnAOnly : LECTURE sur A uniquement (utilisé pour vérifier qu'il
      // ne voit PAS le contenu de B).
      const userBOnAOnlyResult = await addTestUser(db);
      userBOnAOnly = getAuthUserFromUserCredentials(userBOnAOnlyResult.user);
      await setUserCollectiviteRole(db, {
        userId: userBOnAOnlyResult.user.id,
        collectiviteId: collectiviteAId,
        role: CollectiviteRole.LECTURE,
      });

      // userWithReadOnC : ADMIN sur C (a donc COLLECTIVITES.READ_CONFIDENTIEL).
      const adminCResult = await addTestUser(db);
      userWithReadOnC = getAuthUserFromUserCredentials(adminCResult.user);
      await setUserCollectiviteRole(db, {
        userId: adminCResult.user.id,
        collectiviteId: collectiviteCId,
        role: CollectiviteRole.ADMIN,
      });

      // userWithoutReadOnC : aucun rôle sur C — n'a donc ni READ ni
      // READ_CONFIDENTIEL → doit recevoir FORBIDDEN.
      const noAccessResult = await addTestUser(db);
      userWithoutReadOnC = getAuthUserFromUserCredentials(noAccessResult.user);
    });

    afterAll(async () => {
      // Best-effort : nettoyer les docs Meilisearch des collectivités de
      // test pour ne pas polluer un index partagé en CI.
      const allCollectiviteIds = [
        collectiviteAId,
        collectiviteBId,
        collectiviteCId,
      ];
      try {
        await searchIndexer.bulkDelete(PLAN_INDEX, {
          filter: `collectiviteId IN [${allCollectiviteIds.join(', ')}]`,
        });
      } catch {
        // ignore
      }
      try {
        await searchIndexer.bulkDelete(FICHE_INDEX, {
          filter: `visibleCollectiviteIds IN [${allCollectiviteIds.join(
            ', '
          )}]`,
        });
      } catch {
        // ignore
      }
      try {
        await searchIndexer.bulkDelete(INDICATEUR_INDEX, {
          filter: `collectiviteId IN [${allCollectiviteIds.join(', ')}]`,
        });
      } catch {
        // ignore
      }
      try {
        await searchIndexer.bulkDelete(DOCUMENT_INDEX, {
          filter: `collectiviteId IN [${allCollectiviteIds.join(', ')}]`,
        });
      } catch {
        // ignore
      }
      // DB cleanup.
      if (createdFicheIds.length > 0) {
        await db.db
          .delete(ficheActionTable)
          .where(inArray(ficheActionTable.id, createdFicheIds));
      }
      if (createdAxeIds.length > 0) {
        await db.db.delete(axeTable).where(inArray(axeTable.id, createdAxeIds));
      }
      if (createdIndicateurIds.length > 0) {
        await db.db
          .delete(indicateurDefinitionTable)
          .where(
            inArray(indicateurDefinitionTable.id, createdIndicateurIds)
          );
      }
      if (createdFichierIds.length > 0) {
        await db.db
          .delete(bibliothequeFichierTable)
          .where(inArray(bibliothequeFichierTable.id, createdFichierIds));
      }
      await collectiviteACleanup?.();
      await collectiviteBCleanup?.();
      await collectiviteCCleanup?.();
      await app.close();
    });

    // -----------------------------------------------------------------------
    // Helper to seed a Meilisearch document for a given index. Bypasses the
    // BullMQ indexer queue: we just want documents available for the proxy
    // tests. We call `waitForTask` so the doc is visible in the immediately
    // following query.
    // -----------------------------------------------------------------------
    async function seedPlanDoc(args: {
      id: number;
      collectiviteId: number;
      nom: string;
      parent: number | null;
      /**
       * Root plan id this axe belongs to. Defaults to `args.id` (correct for
       * top-level plans). Sub-axes must pass the containing plan's id
       * explicitly so the doc resembles what the indexer actually emits.
       */
      plan?: number;
    }): Promise<void> {
      const doc = { ...args, plan: args.plan ?? args.id };
      const t = await searchIndexer.upsert(PLAN_INDEX, doc);
      await searchIndexer.waitForTask(t.taskUid);
    }

    async function seedFicheDoc(args: {
      id: number;
      titre: string;
      description: string | null;
      parentId: number | null;
      visibleCollectiviteIds: number[];
    }): Promise<void> {
      const t = await searchIndexer.upsert(FICHE_INDEX, args);
      await searchIndexer.waitForTask(t.taskUid);
    }

    async function seedIndicateurDoc(args: {
      id: number;
      identifiantReferentiel: string | null;
      collectiviteId: number | null;
      groupementId: number | null;
      titre: string;
      titreLong: string | null;
      description: string | null;
    }): Promise<void> {
      const t = await searchIndexer.upsert(INDICATEUR_INDEX, args);
      await searchIndexer.waitForTask(t.taskUid);
    }

    async function seedActionDoc(args: {
      id: string;
      collectiviteId: number;
      actionId: string;
      referentielId: string;
      type: string;
      nom: string;
      description: string;
      commentaire: string | null;
    }): Promise<void> {
      const t = await searchIndexer.upsert(ACTION_INDEX, args);
      await searchIndexer.waitForTask(t.taskUid);
    }

    async function seedDocumentDoc(args: {
      id: number;
      collectiviteId: number | null;
      filename: string;
    }): Promise<void> {
      const t = await searchIndexer.upsert(DOCUMENT_INDEX, args);
      await searchIndexer.waitForTask(t.taskUid);
    }

    // -----------------------------------------------------------------------
    // Happy paths
    // -----------------------------------------------------------------------

    test("happy path : 'carbone' avec tous les indexes activés renvoie 5 buckets avec markup <mark>", async () => {
      const stamp = Date.now();
      // Seed un doc dans chaque index pour la collectivité A.
      await seedPlanDoc({
        id: 1_000_000 + stamp,
        collectiviteId: collectiviteAId,
        nom: `Plan carbone ${stamp}`,
        parent: null,
      });
      await seedFicheDoc({
        id: 1_100_000 + stamp,
        titre: `Fiche carbone ${stamp}`,
        description: 'Description évoquant le carbone et la transition',
        parentId: null,
        visibleCollectiviteIds: [collectiviteAId],
      });
      await seedIndicateurDoc({
        id: 1_200_000 + stamp,
        identifiantReferentiel: null,
        collectiviteId: collectiviteAId,
        groupementId: null,
        titre: `Indicateur carbone ${stamp}`,
        titreLong: null,
        description: 'Indicateur de suivi carbone',
      });
      await seedActionDoc({
        id: `cae_test.${stamp}:${collectiviteAId}`,
        collectiviteId: collectiviteAId,
        actionId: `cae_test.${stamp}`,
        referentielId: 'cae',
        type: 'action',
        nom: `Mesure carbone ${stamp}`,
        description: 'Description carbone',
        commentaire: null,
      });
      await seedDocumentDoc({
        id: 1_400_000 + stamp,
        collectiviteId: collectiviteAId,
        filename: `rapport-carbone-${stamp}.pdf`,
      });

      const caller = trpcRouter.createCaller({ user: testUserA });
      const response = await caller.search.query({
        query: 'carbone',
        collectiviteId: collectiviteAId,
        enabledIndexes: [
          'plans',
          'fiches',
          'indicateurs',
          'actions',
          'documents',
        ],
      });

      expect(response.buckets.plans).toBeDefined();
      expect(response.buckets.fiches).toBeDefined();
      expect(response.buckets.indicateurs).toBeDefined();
      expect(response.buckets.actions).toBeDefined();
      expect(response.buckets.documents).toBeDefined();

      // Au moins une fiche bucket retourne un hit avec <mark>.
      const ficheHits = response.buckets.fiches!.hits;
      expect(ficheHits.length).toBeGreaterThanOrEqual(1);
      const ficheTitle = ficheHits.find(
        (h) => h.id === 1_100_000 + stamp
      )?.title;
      expect(ficheTitle).toContain('<mark>');
      expect(ficheTitle).toContain('</mark>');

      // Idem pour le bucket plans.
      const planHits = response.buckets.plans!.hits;
      const planTitle = planHits.find((h) => h.id === 1_000_000 + stamp)?.title;
      expect(planTitle).toContain('<mark>');
    });

    test("happy path (Sous-actions filter) : ficheParentFilter='sous-action' ne renvoie que des sous-fiches", async () => {
      const stamp = Date.now() + 1;
      // Parent (parentId null) + enfant (parentId = parentId).
      const parentId = 1_500_000 + stamp;
      const childId = 1_500_001 + stamp;
      await seedFicheDoc({
        id: parentId,
        titre: `Parent vélo ${stamp}`,
        description: null,
        parentId: null,
        visibleCollectiviteIds: [collectiviteAId],
      });
      await seedFicheDoc({
        id: childId,
        titre: `Enfant vélo ${stamp}`,
        description: null,
        parentId: parentId,
        visibleCollectiviteIds: [collectiviteAId],
      });

      const caller = trpcRouter.createCaller({ user: testUserA });
      const response = await caller.search.query({
        query: `vélo ${stamp}`,
        collectiviteId: collectiviteAId,
        enabledIndexes: ['fiches'],
        ficheParentFilter: 'sous-action',
      });

      const ids = response.buckets.fiches!.hits.map((h) => h.id);
      expect(ids).toContain(childId);
      expect(ids).not.toContain(parentId);
    });

    test("happy path (Actions filter) : ficheParentFilter='top-level' ne renvoie que les fiches sans parent", async () => {
      const stamp = Date.now() + 2;
      const parentId = 1_600_000 + stamp;
      const childId = 1_600_001 + stamp;
      await seedFicheDoc({
        id: parentId,
        titre: `Parent piscine ${stamp}`,
        description: null,
        parentId: null,
        visibleCollectiviteIds: [collectiviteAId],
      });
      await seedFicheDoc({
        id: childId,
        titre: `Enfant piscine ${stamp}`,
        description: null,
        parentId: parentId,
        visibleCollectiviteIds: [collectiviteAId],
      });

      const caller = trpcRouter.createCaller({ user: testUserA });
      const response = await caller.search.query({
        query: `piscine ${stamp}`,
        collectiviteId: collectiviteAId,
        enabledIndexes: ['fiches'],
        ficheParentFilter: 'top-level',
      });

      const ids = response.buckets.fiches!.hits.map((h) => h.id);
      expect(ids).toContain(parentId);
      expect(ids).not.toContain(childId);
    });

    test("planParentFilter='root' : ne renvoie que les plans racines (parent IS NULL)", async () => {
      const stamp = Date.now() + 4;
      const rootId = 1_700_000 + stamp;
      const axeId = 1_700_001 + stamp;
      await seedPlanDoc({
        id: rootId,
        collectiviteId: collectiviteAId,
        nom: `Plan vélo ${stamp}`,
        parent: null,
      });
      await seedPlanDoc({
        id: axeId,
        collectiviteId: collectiviteAId,
        nom: `Axe vélo ${stamp}`,
        parent: rootId,
        plan: rootId,
      });

      const caller = trpcRouter.createCaller({ user: testUserA });
      const response = await caller.search.query({
        query: `vélo ${stamp}`,
        collectiviteId: collectiviteAId,
        enabledIndexes: ['plans'],
        planParentFilter: 'root',
      });

      const ids = response.buckets.plans!.hits.map((h) => h.id);
      expect(ids).toContain(rootId);
      expect(ids).not.toContain(axeId);
    });

    test("planParentFilter='axe' : ne renvoie que les sous-axes (parent IS NOT NULL)", async () => {
      const stamp = Date.now() + 5;
      const rootId = 1_800_000 + stamp;
      const axeId = 1_800_001 + stamp;
      await seedPlanDoc({
        id: rootId,
        collectiviteId: collectiviteAId,
        nom: `Plan piscine ${stamp}`,
        parent: null,
      });
      await seedPlanDoc({
        id: axeId,
        collectiviteId: collectiviteAId,
        nom: `Axe piscine ${stamp}`,
        parent: rootId,
        plan: rootId,
      });

      const caller = trpcRouter.createCaller({ user: testUserA });
      const response = await caller.search.query({
        query: `piscine ${stamp}`,
        collectiviteId: collectiviteAId,
        enabledIndexes: ['plans'],
        planParentFilter: 'axe',
      });

      const ids = response.buckets.plans!.hits.map((h) => h.id);
      expect(ids).toContain(axeId);
      expect(ids).not.toContain(rootId);
    });

    test("planParentFilter='all' (défaut) : renvoie plans racines ET sous-axes", async () => {
      const stamp = Date.now() + 6;
      const rootId = 1_900_000 + stamp;
      const axeId = 1_900_001 + stamp;
      await seedPlanDoc({
        id: rootId,
        collectiviteId: collectiviteAId,
        nom: `Plan énergie ${stamp}`,
        parent: null,
      });
      await seedPlanDoc({
        id: axeId,
        collectiviteId: collectiviteAId,
        nom: `Axe énergie ${stamp}`,
        parent: rootId,
        plan: rootId,
      });

      const caller = trpcRouter.createCaller({ user: testUserA });
      const response = await caller.search.query({
        query: `énergie ${stamp}`,
        collectiviteId: collectiviteAId,
        enabledIndexes: ['plans'],
        // planParentFilter omitted → defaults to 'all'
      });

      const ids = response.buckets.plans!.hits.map((h) => h.id);
      expect(ids).toContain(rootId);
      expect(ids).toContain(axeId);
    });

    test("happy path (mode exclusif) : enabledIndexes=['actions'] ne renvoie que le bucket actions", async () => {
      const stamp = Date.now() + 3;
      await seedActionDoc({
        id: `cae_excl.${stamp}:${collectiviteAId}`,
        collectiviteId: collectiviteAId,
        actionId: `cae_excl.${stamp}`,
        referentielId: 'cae',
        type: 'action',
        nom: `Mesure unique ${stamp}`,
        description: 'Description unique',
        commentaire: null,
      });

      const caller = trpcRouter.createCaller({ user: testUserA });
      const response = await caller.search.query({
        query: `unique ${stamp}`,
        collectiviteId: collectiviteAId,
        enabledIndexes: ['actions'],
      });

      // Seul le bucket actions est renseigné.
      expect(response.buckets.actions).toBeDefined();
      expect(response.buckets.plans).toBeUndefined();
      expect(response.buckets.fiches).toBeUndefined();
      expect(response.buckets.indicateurs).toBeUndefined();
      expect(response.buckets.documents).toBeUndefined();
      expect(response.buckets.actions!.hits.length).toBeGreaterThanOrEqual(1);
    });

    // -----------------------------------------------------------------------
    // CRITICAL — cross-collectivité isolation (R4)
    // -----------------------------------------------------------------------

    test('CRITIQUE — isolation cross-collectivité : fiches/plans/custom-indicateurs de B ne sont pas dans la réponse pour une recherche côté A', async () => {
      const stamp = Date.now() + 4;
      // Seed côté B uniquement.
      await seedPlanDoc({
        id: 1_700_000 + stamp,
        collectiviteId: collectiviteBId,
        nom: `Plan secret B ${stamp}`,
        parent: null,
      });
      await seedFicheDoc({
        id: 1_700_100 + stamp,
        titre: `Fiche secrète B ${stamp}`,
        description: null,
        parentId: null,
        visibleCollectiviteIds: [collectiviteBId],
      });
      await seedIndicateurDoc({
        id: 1_700_200 + stamp,
        identifiantReferentiel: null,
        collectiviteId: collectiviteBId,
        groupementId: null,
        titre: `Indicateur custom B ${stamp}`,
        titreLong: null,
        description: null,
      });
      // Predefined indicateur (collectiviteId IS NULL) : doit être visible
      // pour A et B.
      await seedIndicateurDoc({
        id: 1_700_300 + stamp,
        identifiantReferentiel: `pred.${stamp}`,
        collectiviteId: null,
        groupementId: null,
        titre: `Indicateur prédéfini ${stamp}`,
        titreLong: null,
        description: null,
      });
      // Document global (collectiviteId IS NULL) : visible pour A et B.
      await seedDocumentDoc({
        id: 1_700_400 + stamp,
        collectiviteId: null,
        filename: `global-${stamp}.pdf`,
      });

      const caller = trpcRouter.createCaller({ user: userBOnAOnly });
      const response = await caller.search.query({
        query: `${stamp}`,
        collectiviteId: collectiviteAId,
        enabledIndexes: ['plans', 'fiches', 'indicateurs', 'documents'],
      });

      // Aucune donnée privée de B ne doit apparaître.
      const planIds = response.buckets.plans!.hits.map((h) => h.id);
      expect(planIds).not.toContain(1_700_000 + stamp);
      const ficheIds = response.buckets.fiches!.hits.map((h) => h.id);
      expect(ficheIds).not.toContain(1_700_100 + stamp);
      const indicIds = response.buckets.indicateurs!.hits.map((h) => h.id);
      expect(indicIds).not.toContain(1_700_200 + stamp);
      // L'indicateur prédéfini ET le document global SONT visibles côté A.
      expect(indicIds).toContain(1_700_300 + stamp);
      const docIds = response.buckets.documents!.hits.map((h) => h.id);
      expect(docIds).toContain(1_700_400 + stamp);
    });

    // -----------------------------------------------------------------------
    // CRITICAL — fiche sharing (R4)
    // -----------------------------------------------------------------------

    test('CRITIQUE — sharing : une fiche partagée de A vers B apparaît dans les résultats côté B', async () => {
      const stamp = Date.now() + 5;
      const sharedFicheId = 1_800_000 + stamp;
      await seedFicheDoc({
        id: sharedFicheId,
        titre: `Fiche partagée ${stamp}`,
        description: null,
        parentId: null,
        // owner = A, partagée avec B → visible côté A ET côté B.
        visibleCollectiviteIds: [collectiviteAId, collectiviteBId],
      });

      const caller = trpcRouter.createCaller({ user: testUserB });
      const response = await caller.search.query({
        query: `partagée ${stamp}`,
        collectiviteId: collectiviteBId,
        enabledIndexes: ['fiches'],
      });

      const ids = response.buckets.fiches!.hits.map((h) => h.id);
      expect(ids).toContain(sharedFicheId);
    });

    // -----------------------------------------------------------------------
    // CRITICAL — accesRestreint
    // -----------------------------------------------------------------------

    test('CRITIQUE — accesRestreint : un user sans READ_CONFIDENTIEL sur la collectivité C confidentielle reçoit FORBIDDEN', async () => {
      const caller = trpcRouter.createCaller({ user: userWithoutReadOnC });
      await expect(
        caller.search.query({
          query: 'test',
          collectiviteId: collectiviteCId,
          enabledIndexes: ['plans'],
        })
      ).rejects.toThrow();
    });

    test('accesRestreint : un user avec READ_CONFIDENTIEL sur C reçoit les résultats', async () => {
      const stamp = Date.now() + 6;
      const planIdC = 1_900_000 + stamp;
      await seedPlanDoc({
        id: planIdC,
        collectiviteId: collectiviteCId,
        nom: `Plan confidentiel ${stamp}`,
        parent: null,
      });

      const caller = trpcRouter.createCaller({ user: userWithReadOnC });
      const response = await caller.search.query({
        query: `confidentiel ${stamp}`,
        collectiviteId: collectiviteCId,
        enabledIndexes: ['plans'],
      });

      const ids = response.buckets.plans!.hits.map((h) => h.id);
      expect(ids).toContain(planIdC);
    });

    // -----------------------------------------------------------------------
    // Edge cases
    // -----------------------------------------------------------------------

    test('edge case : résultat vide → buckets avec hits=[], pas de 404', async () => {
      const caller = trpcRouter.createCaller({ user: testUserA });
      const response = await caller.search.query({
        query: 'azertyzzzzzz_no_match_zzzzzzz',
        collectiviteId: collectiviteAId,
        enabledIndexes: ['plans', 'fiches'],
      });
      expect(response.buckets.plans!.hits).toEqual([]);
      expect(response.buckets.fiches!.hits).toEqual([]);
      expect(response.totalHits).toBe(0);
    });

    test('edge case : query contenant de la syntaxe de filtre Meilisearch est traitée comme du texte', async () => {
      // On seed un plan qui ne matchera RIEN si la query est
      // interprétée comme un filtre. Si la query est traitée comme texte,
      // le plan ne devrait pas non plus matcher (il ne contient pas le
      // texte). On vérifie surtout qu'aucune erreur n'est levée et que la
      // réponse a la forme attendue.
      const caller = trpcRouter.createCaller({ user: testUserA });
      const response = await caller.search.query({
        query: 'collectiviteId = 999',
        collectiviteId: collectiviteAId,
        enabledIndexes: ['plans'],
      });
      expect(response.buckets.plans).toBeDefined();
      expect(Array.isArray(response.buckets.plans!.hits)).toBe(true);
    });
  }
);

// ----------------------------------------------------------------------------
// Tests qui ne dépendent pas de Meilisearch live : on stubbe
// SearchIndexerService côté DI pour valider Zod, FORBIDDEN, control-chars,
// rate-limit, et le wrapping d'erreur Meilisearch en INTERNAL_SERVER_ERROR.
// ----------------------------------------------------------------------------

describe('SearchRouter (unit, mocked Meilisearch)', () => {
  let app: INestApplication;
  let trpcRouter: TrpcRouter;
  let db: DatabaseService;
  let testUser: AuthenticatedUser;
  let collectiviteId: number;
  let collectiviteCleanup: () => Promise<void>;
  let multiSearchSpy: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    app = await getTestApp({
      overrides: (builder) => {
        // Stub multiSearch — chaque test règle son comportement via
        // multiSearchSpy.mock*. Les autres méthodes ne sont pas appelées.
        builder
          .overrideProvider(SearchIndexerService)
          .useValue({
            multiSearch: vi.fn(),
            health: vi.fn().mockResolvedValue({ status: 'available' }),
            ensureIndexSettings: vi.fn(),
            // Eviter le bootstrap onApplicationBootstrap d'écrire vers
            // Meilisearch : les autres méthodes ne sont jamais appelées
            // dans ce describe, mais on les stubbe par sécurité.
            upsert: vi.fn(),
            bulkUpsert: vi.fn(),
            delete: vi.fn(),
            bulkDelete: vi.fn(),
            swapIndexes: vi.fn(),
            waitForTask: vi.fn(),
          });
      },
    });
    trpcRouter = await getTestRouter(app);
    db = await getTestDatabase(app);

    const col = await addTestCollectivite(db);
    collectiviteId = col.collectivite.id;
    collectiviteCleanup = col.cleanup;

    const userResult = await addTestUser(db);
    testUser = getAuthUserFromUserCredentials(userResult.user);
    await setUserCollectiviteRole(db, {
      userId: userResult.user.id,
      collectiviteId,
      role: CollectiviteRole.LECTURE,
    });

    multiSearchSpy = app.get(SearchIndexerService).multiSearch as ReturnType<
      typeof vi.fn
    >;
  });

  afterAll(async () => {
    await collectiviteCleanup?.();
    await app.close();
  });

  // ---------------------------------------------------------------------
  // Zod validation
  // ---------------------------------------------------------------------

  test('Zod : query > 200 chars → erreur de validation', async () => {
    const caller = trpcRouter.createCaller({ user: testUser });
    const longQuery = 'a'.repeat(201);
    await expect(
      caller.search.query({
        query: longQuery,
        collectiviteId,
        enabledIndexes: ['plans'],
      })
    ).rejects.toThrow();
  });

  test('Zod : query de 200 chars → passe la validation (pas de réjet Zod)', async () => {
    multiSearchSpy.mockResolvedValueOnce({
      results: [
        { hits: [], processingTimeMs: 0, query: '', estimatedTotalHits: 0 },
      ],
    });
    const caller = trpcRouter.createCaller({ user: testUser });
    const okQuery = 'a'.repeat(200);
    const response = await caller.search.query({
      query: okQuery,
      collectiviteId,
      enabledIndexes: ['plans'],
    });
    expect(response.buckets.plans).toBeDefined();
  });

  // ---------------------------------------------------------------------
  // Control chars are stripped
  // ---------------------------------------------------------------------

  test('control chars : la query envoyée à Meilisearch est dépouillée des caractères de contrôle', async () => {
    multiSearchSpy.mockClear();
    multiSearchSpy.mockResolvedValueOnce({
      results: [
        { hits: [], processingTimeMs: 0, query: '', estimatedTotalHits: 0 },
      ],
    });
    const caller = trpcRouter.createCaller({ user: testUser });
    // Mélange : `\x00` (null), `\x07` (bell), `\x1b` (esc), `\x7f` (delete).
    await caller.search.query({
      query: 'foo\x00bar\x07baz\x1bqux\x7f',
      collectiviteId,
      enabledIndexes: ['plans'],
    });
    expect(multiSearchSpy).toHaveBeenCalledTimes(1);
    const call = multiSearchSpy.mock.calls[0][0] as {
      queries: Array<{ q: string }>;
    };
    // Aucun caractère de contrôle ne doit subsister ; les tokens textuels
    // sont préservés dans l'ordre.
    expect(call.queries[0].q).toBe('foobarbazqux');
    expect(call.queries[0].q).not.toMatch(/[\x00-\x1F\x7F]/);
  });

  test('control chars : query entièrement composée de caractères de contrôle → réponse vide sans appel Meilisearch', async () => {
    multiSearchSpy.mockClear();
    const caller = trpcRouter.createCaller({ user: testUser });
    const response = await caller.search.query({
      query: '\x00\x01\x02',
      collectiviteId,
      enabledIndexes: ['plans', 'fiches'],
    });
    expect(multiSearchSpy).not.toHaveBeenCalled();
    expect(response.buckets.plans!.hits).toEqual([]);
    expect(response.buckets.fiches!.hits).toEqual([]);
    expect(response.totalHits).toBe(0);
  });

  // ---------------------------------------------------------------------
  // FORBIDDEN — user without read access
  // ---------------------------------------------------------------------

  test('FORBIDDEN : un user sans accès à la collectivité reçoit une erreur', async () => {
    const noAccessUserResult = await addTestUser(db);
    const noAccessUser = getAuthUserFromUserCredentials(
      noAccessUserResult.user
    );
    const caller = trpcRouter.createCaller({ user: noAccessUser });
    await expect(
      caller.search.query({
        query: 'foo',
        collectiviteId,
        enabledIndexes: ['plans'],
      })
    ).rejects.toThrow();
  });

  // ---------------------------------------------------------------------
  // Meilisearch unreachable → INTERNAL_SERVER_ERROR with stable message
  // ---------------------------------------------------------------------

  test('Meilisearch indisponible → INTERNAL_SERVER_ERROR avec message stable, pas de fuite interne', async () => {
    multiSearchSpy.mockReset();
    multiSearchSpy.mockRejectedValueOnce(
      Object.assign(new Error('ECONNREFUSED 127.0.0.1:7700 SECRET_LEAK'), {
        code: 'meilisearch_communication_error',
      })
    );
    const caller = trpcRouter.createCaller({ user: testUser });
    let caught: unknown;
    try {
      await caller.search.query({
        query: 'foo',
        collectiviteId,
        enabledIndexes: ['plans'],
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();
    const message = (caught as { message: string }).message;
    expect(message).toContain('temporairement indisponible');
    // Le message ne doit PAS contenir le détail interne (host/port, code).
    expect(message).not.toContain('ECONNREFUSED');
    expect(message).not.toContain('7700');
    expect(message).not.toContain('SECRET_LEAK');
    expect(message).not.toContain('meilisearch_communication_error');
  });

  // ---------------------------------------------------------------------
  // Rate-limit : 60 req OK ; 61e en 429
  // ---------------------------------------------------------------------

  test('rate-limit : la 61e requête en moins de 60s reçoit TOO_MANY_REQUESTS', async () => {
    // Reset l'état du limiter pour ce test : on récupère l'instance et on
    // vide la map keyed-by-userId. Cela évite la pollution depuis les tests
    // précédents qui ont consommé une partie du budget.
    const router = app.get(SearchRouter) as unknown as {
      rateLimitBuckets: Map<string, number[]>;
    };
    router.rateLimitBuckets.clear();

    // multiSearch renvoie un résultat vide pour chaque appel.
    multiSearchSpy.mockReset();
    multiSearchSpy.mockResolvedValue({
      results: [
        { hits: [], processingTimeMs: 0, query: '', estimatedTotalHits: 0 },
      ],
    });

    const caller = trpcRouter.createCaller({ user: testUser });
    for (let i = 0; i < SEARCH_RATE_LIMIT_REQUESTS; i++) {
      await caller.search.query({
        query: `req-${i}`,
        collectiviteId,
        enabledIndexes: ['plans'],
      });
    }
    // La 61e doit être rejetée.
    let caught: unknown;
    try {
      await caller.search.query({
        query: 'req-overflow',
        collectiviteId,
        enabledIndexes: ['plans'],
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();
    expect((caught as { message: string }).message).toContain(
      'Trop de requêtes'
    );
    // Le SearchService.search ne doit PAS avoir été appelé pour la 61e :
    // multiSearchSpy s'arrête au compte initial.
    expect(multiSearchSpy).toHaveBeenCalledTimes(SEARCH_RATE_LIMIT_REQUESTS);
  });
});

// ----------------------------------------------------------------------------
// Pure-unit : SearchService instancié à la main (pas d'app NestJS) pour
// valider les chemins qui n'exigent ni Meilisearch ni accès DB.
// ----------------------------------------------------------------------------

describe('SearchService (pure unit)', () => {
  test('query post-strip vide → réponse vide sans appel Meilisearch', async () => {
    const multiSearch = vi.fn();
    const isAllowed = vi.fn().mockResolvedValue(true);
    const isPrivate = vi.fn().mockResolvedValue(false);

    const service = new SearchService(
      { isAllowed } as never,
      { isPrivate } as never,
      { multiSearch } as never
    );

    const response = await service.search(
      { id: 'user-1', role: 'authenticated' } as never,
      {
        query: '\x00\x01',
        collectiviteId: 1,
        enabledIndexes: ['plans', 'fiches'],
        exclusiveMode: false,
        ficheParentFilter: 'all',
        limit: 20,
      }
    );

    expect(multiSearch).not.toHaveBeenCalled();
    // La permission n'a même pas besoin d'être vérifiée si la query est
    // vide après strip — et ne l'est effectivement pas.
    expect(isAllowed).not.toHaveBeenCalled();
    expect(isPrivate).not.toHaveBeenCalled();
    expect(response.totalHits).toBe(0);
    expect(response.buckets.plans).toEqual({
      hits: [],
      estimatedTotalHits: 0,
      processingTimeMs: 0,
    });
  });

  test('isPrivate=true → permission op = COLLECTIVITES.READ_CONFIDENTIEL', async () => {
    const multiSearch = vi.fn().mockResolvedValue({
      results: [
        { hits: [], processingTimeMs: 0, query: '', estimatedTotalHits: 0 },
      ],
    });
    const isAllowed = vi.fn().mockResolvedValue(true);
    const isPrivate = vi.fn().mockResolvedValue(true);

    const service = new SearchService(
      { isAllowed } as never,
      { isPrivate } as never,
      { multiSearch } as never
    );

    await service.search(
      { id: 'user-1', role: 'authenticated' } as never,
      {
        query: 'test',
        collectiviteId: 42,
        enabledIndexes: ['plans'],
        exclusiveMode: false,
        ficheParentFilter: 'all',
        limit: 20,
      }
    );

    // L'op vérifiée doit être READ_CONFIDENTIEL parce qu'isPrivate=true.
    expect(isAllowed).toHaveBeenCalledWith(
      expect.anything(),
      'collectivites.read_confidentiel',
      expect.anything(),
      42,
      true
    );
  });

  test('isPrivate=false → permission op = COLLECTIVITES.READ', async () => {
    const multiSearch = vi.fn().mockResolvedValue({
      results: [
        { hits: [], processingTimeMs: 0, query: '', estimatedTotalHits: 0 },
      ],
    });
    const isAllowed = vi.fn().mockResolvedValue(true);
    const isPrivate = vi.fn().mockResolvedValue(false);

    const service = new SearchService(
      { isAllowed } as never,
      { isPrivate } as never,
      { multiSearch } as never
    );

    await service.search(
      { id: 'user-1', role: 'authenticated' } as never,
      {
        query: 'test',
        collectiviteId: 42,
        enabledIndexes: ['plans'],
        exclusiveMode: false,
        ficheParentFilter: 'all',
        limit: 20,
      }
    );

    expect(isAllowed).toHaveBeenCalledWith(
      expect.anything(),
      'collectivites.read',
      expect.anything(),
      42,
      true
    );
  });

  test('buildTenantFilter : fiches avec ficheParentFilter=top-level inclut "AND parentId IS NULL"', async () => {
    const multiSearch = vi.fn().mockResolvedValue({
      results: [
        { hits: [], processingTimeMs: 0, query: '', estimatedTotalHits: 0 },
      ],
    });
    const isAllowed = vi.fn().mockResolvedValue(true);
    const isPrivate = vi.fn().mockResolvedValue(false);

    const service = new SearchService(
      { isAllowed } as never,
      { isPrivate } as never,
      { multiSearch } as never
    );

    await service.search(
      { id: 'user-1', role: 'authenticated' } as never,
      {
        query: 'test',
        collectiviteId: 42,
        enabledIndexes: ['fiches'],
        exclusiveMode: false,
        ficheParentFilter: 'top-level',
        limit: 20,
      }
    );

    const call = multiSearch.mock.calls[0][0] as {
      queries: Array<{ filter: string }>;
    };
    expect(call.queries[0].filter).toBe(
      'visibleCollectiviteIds = 42 AND parentId IS NULL'
    );
  });

  test('buildTenantFilter : indicateurs utilise (collectiviteId IS NULL OR collectiviteId = X)', async () => {
    const multiSearch = vi.fn().mockResolvedValue({
      results: [
        { hits: [], processingTimeMs: 0, query: '', estimatedTotalHits: 0 },
      ],
    });
    const isAllowed = vi.fn().mockResolvedValue(true);
    const isPrivate = vi.fn().mockResolvedValue(false);

    const service = new SearchService(
      { isAllowed } as never,
      { isPrivate } as never,
      { multiSearch } as never
    );

    await service.search(
      { id: 'user-1', role: 'authenticated' } as never,
      {
        query: 'test',
        collectiviteId: 7,
        enabledIndexes: ['indicateurs', 'documents'],
        exclusiveMode: false,
        ficheParentFilter: 'all',
        limit: 20,
      }
    );

    const call = multiSearch.mock.calls[0][0] as {
      queries: Array<{ indexUid: string; filter: string }>;
    };
    expect(call.queries[0].indexUid).toBe('indicateurs');
    expect(call.queries[0].filter).toBe(
      '(collectiviteId IS NULL OR collectiviteId = 7)'
    );
    expect(call.queries[1].indexUid).toBe('documents');
    expect(call.queries[1].filter).toBe(
      '(collectiviteId IS NULL OR collectiviteId = 7)'
    );
  });
});
