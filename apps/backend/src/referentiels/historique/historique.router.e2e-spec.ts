import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { questionThematiqueTable } from '@tet/backend/collectivites/personnalisations/models/question-thematique.table';
import { questionTable } from '@tet/backend/collectivites/personnalisations/models/question.table';
import { reponseBinaireTable } from '@tet/backend/collectivites/personnalisations/models/reponse-binaire.table';
import { actionCommentaireTable } from '@tet/backend/referentiels/models/action-commentaire.table';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { actionRelationTable } from '@tet/backend/referentiels/models/action-relation.table';
import { historiqueActionStatutTable } from '@tet/backend/referentiels/models/historique-action-statut.table';
import { cleanupReferentielActionStatutsAndLabellisations } from '@tet/backend/referentiels/update-action-statut/referentiel-action-statut.test-fixture';
import { getAuthUserFromUserCredentials } from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import {
  ActionTypeEnum,
  HistoriqueActionStatutItem,
  HistoriqueItem,
  NB_HISTORIQUE_ITEMS_PER_PAGE,
} from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';
import { eq } from 'drizzle-orm';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../test/app-utils';

type ListInput = inferProcedureInput<
  AppRouter['referentiels']['historique']['list']
>;

type ListUtilisateursInput = inferProcedureInput<
  AppRouter['referentiels']['historique']['listUtilisateurs']
>;

const TACHE_ACTION_ID = 'cae_1.1.1.1.2'; // profondeur 5 → tache
const SOUS_ACTION_ID = 'cae_1.1.1.1'; // profondeur 4 → sous-action
const ECI_SOUS_ACTION_ID = 'eci_1.1.1'; // ECI n'a pas de sous-axe, donc prof 3 → sous-action

/**
 * Narrow un `HistoriqueItem` (union discriminée) sur son `type`. Les
 * assertions `expect(item.type).toBe(...)` ne propagent pas le narrowing
 * côté TS — ce helper le fait explicitement et throw si le type ne matche
 * pas.
 */
function assertHistoriqueType<T extends HistoriqueItem['type']>(
  item: HistoriqueItem,
  type: T
): asserts item is Extract<HistoriqueItem, { type: T }> {
  if (item.type !== type) {
    throw new Error(
      `Expected historique item of type "${type}", got "${item.type}"`
    );
  }
}

/**
 * Récupère le premier item du `type` demandé en narrowant son type. Throw
 * si aucune ligne ne matche.
 */
function requireItemOfType<T extends HistoriqueItem['type']>(
  items: HistoriqueItem[],
  type: T
): Extract<HistoriqueItem, { type: T }> {
  const found = items.find(
    (i): i is Extract<HistoriqueItem, { type: T }> => i.type === type
  );
  if (!found) {
    throw new Error(`Expected at least one historique item of type "${type}"`);
  }
  return found;
}

const TEST_QUESTION_BINAIRE_ID = 'hist-test-question-binaire';
const TEST_THEMATIQUE_ID = 'hist-test-thematique';

const cleanupHistorique = async (
  databaseService: DatabaseService,
  collectiviteId: number
) => {
  // `cleanupReferentielActionStatutsAndLabellisations` prend maintenant en
  // charge les historiques (statut, précision, réponses, justification) +
  // préférences d'évaluation. On nettoie ici les tables publiques
  // restantes écrites via tRPC qu'elle ne touche pas (les `reponse_*`
  // publiques sont purgées par le cleanup de la collectivité elle-même).
  await cleanupReferentielActionStatutsAndLabellisations(
    databaseService,
    collectiviteId
  );
  await databaseService.db
    .delete(reponseBinaireTable)
    .where(eq(reponseBinaireTable.collectiviteId, collectiviteId));
  await databaseService.db
    .delete(actionCommentaireTable)
    .where(eq(actionCommentaireTable.collectiviteId, collectiviteId));
};

type SeedInput = {
  collectiviteId: number;
  actionId: string;
};

/**
 * Seed historique.action_statut rows by going through the real tRPC
 * mutation `referentiels.actions.updateStatuts`. The backend
 * `UpdateActionStatutHistoriqueRepository` takes care of writing the
 * historique entry; this keeps the test realistic and exercises the
 * full write path in a single batch call.
 */
const seedHistoriqueActionStatuts = async (
  router: TrpcRouter,
  user: AuthenticatedUser,
  actionStatuts: SeedInput[]
) => {
  const caller = router.createCaller({ user });
  await caller.referentiels.actions.updateStatuts({
    actionStatuts: actionStatuts.map((a) => ({
      collectiviteId: a.collectiviteId,
      actionId: a.actionId,
      statut: 'fait',
    })),
  });
};

/**
 * Seed une ligne d'historique.action_precision via la mutation tRPC
 * `referentiels.actions.updateCommentaire` — `UpdateActionCommentaireHistoriqueRepository`
 * écrit l'entrée historique dans la même transaction.
 */
const seedHistoriqueActionCommentaire = async (
  router: TrpcRouter,
  user: AuthenticatedUser,
  input: { collectiviteId: number; actionId: string; commentaire?: string }
) => {
  const caller = router.createCaller({ user });
  await caller.referentiels.actions.updateCommentaire({
    collectiviteId: input.collectiviteId,
    actionId: input.actionId,
    commentaire: input.commentaire ?? 'Test commentaire historique',
  });
};

/**
 * Seed une ligne d'historique.reponse_binaire via `collectivites.personnalisations.setReponse`.
 * Le trigger `save_reponse_binaire` sur la table `reponse_binaire` produit
 * la ligne historique.
 */
const seedHistoriqueReponse = async (
  router: TrpcRouter,
  user: AuthenticatedUser,
  input: { collectiviteId: number; questionId: string; reponse: boolean }
) => {
  const caller = router.createCaller({ user });
  await caller.collectivites.personnalisations.setReponse({
    collectiviteId: input.collectiviteId,
    questionId: input.questionId,
    reponse: input.reponse,
  });
};

/**
 * Seed une ligne d'historique.justification via
 * `collectivites.personnalisations.setReponse`. Le service écrit
 * l'entrée historique.justification dès que la justification diffère
 * de celle en base (et dédupliquera la reponse si elle est identique
 * à la reponse courante).
 */
const seedHistoriqueJustification = async (
  router: TrpcRouter,
  user: AuthenticatedUser,
  input: {
    collectiviteId: number;
    questionId: string;
    texte: string;
    reponse?: boolean;
  }
) => {
  const caller = router.createCaller({ user });
  await caller.collectivites.personnalisations.setReponse({
    collectiviteId: input.collectiviteId,
    questionId: input.questionId,
    reponse: input.reponse ?? true,
    justification: input.texte,
  });
};

describe('HistoriqueRouter', () => {
  let router: TrpcRouter;
  let databaseService: DatabaseService;

  let collectiviteA: Collectivite;
  let editorA: AuthenticatedUser;
  let adminA: AuthenticatedUser;
  let readerA: AuthenticatedUser;

  let collectiviteB: Collectivite;
  let editorB: AuthenticatedUser;
  let readerB: AuthenticatedUser;

  const cleanups: (() => Promise<void>)[] = [];

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const resultA = await addTestCollectiviteAndUsers(databaseService, {
      users: [
        { role: CollectiviteRole.EDITION },
        { role: CollectiviteRole.LECTURE },
        { role: CollectiviteRole.ADMIN },
      ],
      // Privée pour exercer le branch `referentiels.read_confidentiel` :
      // un non-membre doit être rejeté par PermissionService.isAllowed.
      collectivite: { accesRestreint: true },
    });
    collectiviteA = resultA.collectivite;
    editorA = getAuthUserFromUserCredentials(resultA.users[0]);
    readerA = getAuthUserFromUserCredentials(resultA.users[1]);
    adminA = getAuthUserFromUserCredentials(resultA.users[2]);
    cleanups.push(resultA.cleanup);

    const resultB = await addTestCollectiviteAndUsers(databaseService, {
      users: [
        { role: CollectiviteRole.EDITION },
        { role: CollectiviteRole.LECTURE },
      ],
    });
    collectiviteB = resultB.collectivite;
    editorB = getAuthUserFromUserCredentials(resultB.users[0]);
    readerB = getAuthUserFromUserCredentials(resultB.users[1]);
    cleanups.push(resultB.cleanup);

    // Thématique + question de test pour les réponses/justifications
    // (onConflictDoNothing pour supporter la ré-exécution sans cleanup global).
    await databaseService.db
      .insert(questionThematiqueTable)
      .values({ id: TEST_THEMATIQUE_ID, nom: 'Historique test' })
      .onConflictDoNothing();
    await databaseService.db
      .insert(questionTable)
      .values({
        id: TEST_QUESTION_BINAIRE_ID,
        type: 'binaire',
        description: 'Question binaire pour les tests historique',
        formulation: 'Question test ?',
        thematiqueId: TEST_THEMATIQUE_ID,
        version: '1.0.0',
      })
      .onConflictDoNothing();
    cleanups.push(async () => {
      await databaseService.db
        .delete(questionTable)
        .where(eq(questionTable.id, TEST_QUESTION_BINAIRE_ID));
      await databaseService.db
        .delete(questionThematiqueTable)
        .where(eq(questionThematiqueTable.id, TEST_THEMATIQUE_ID));
    });

    return async () => {
      for (const cleanup of cleanups) {
        await cleanup();
      }
    };
  });

  afterEach(async () => {
    await cleanupHistorique(databaseService, collectiviteA.id);
    await cleanupHistorique(databaseService, collectiviteB.id);
  });

  describe('list', () => {
    const baseInput = (collectiviteId: number): ListInput => ({
      collectiviteId,
      filters: {},
    });

    test('rejette un appel non authentifié', async () => {
      const caller = router.createCaller({ user: null });
      await expect(() =>
        caller.referentiels.historique.list(baseInput(collectiviteA.id))
      ).rejects.toThrowError(/not authenticated/i);
    });

    test('un lecteur de la collectivité peut lire son historique', async () => {
      await seedHistoriqueActionStatuts(router, editorA, [
        { collectiviteId: collectiviteA.id, actionId: TACHE_ACTION_ID },
      ]);

      const readerCaller = router.createCaller({ user: readerA });
      const { items, total } = await readerCaller.referentiels.historique.list(
        baseInput(collectiviteA.id)
      );

      expect(total).toBe(1);
      expect(items).toHaveLength(1);
      assertHistoriqueType(items[0], 'action_statut');
      expect(items[0].actionId).toBe(TACHE_ACTION_ID);
    });

    test('union sur les 4 sources : action_statut, action_precision, reponse, justification', async () => {
      await seedHistoriqueActionStatuts(router, editorA, [
        { collectiviteId: collectiviteA.id, actionId: TACHE_ACTION_ID },
      ]);
      await seedHistoriqueActionCommentaire(router, editorA, {
        collectiviteId: collectiviteA.id,
        actionId: SOUS_ACTION_ID,
        commentaire: 'Précision test',
      });
      await seedHistoriqueReponse(router, editorA, {
        collectiviteId: collectiviteA.id,
        questionId: TEST_QUESTION_BINAIRE_ID,
        reponse: true,
      });
      await seedHistoriqueJustification(router, editorA, {
        collectiviteId: collectiviteA.id,
        questionId: TEST_QUESTION_BINAIRE_ID,
        texte: 'Justification test',
      });

      const caller = router.createCaller({ user: readerA });
      const { items } = await caller.referentiels.historique.list(
        baseInput(collectiviteA.id)
      );

      const statutItem = requireItemOfType(items, 'action_statut');
      expect(statutItem.actionId).toBe(TACHE_ACTION_ID);
      expect(statutItem.actionType).toBe(ActionTypeEnum.TACHE);

      const precisionItem = requireItemOfType(items, 'action_precision');
      expect(precisionItem.actionId).toBe(SOUS_ACTION_ID);
      expect(precisionItem.actionType).toBe(ActionTypeEnum.SOUS_ACTION);
      expect(precisionItem.precision).toBe('Précision test');

      const reponseItem = requireItemOfType(items, 'reponse');
      expect(reponseItem.questionId).toBe(TEST_QUESTION_BINAIRE_ID);

      const justificationItem = requireItemOfType(items, 'justification');
      expect(justificationItem.questionId).toBe(TEST_QUESTION_BINAIRE_ID);
      expect(justificationItem.justification).toBe('Justification test');
    });

    test('calcule actionType depuis la hiérarchie du référentiel', async () => {
      // updateStatuts exige que toutes les actions d'un batch soient dans le
      // même référentiel — on splitte donc en deux appels.
      await seedHistoriqueActionStatuts(router, editorA, [
        { collectiviteId: collectiviteA.id, actionId: TACHE_ACTION_ID },
        { collectiviteId: collectiviteA.id, actionId: SOUS_ACTION_ID },
      ]);
      await seedHistoriqueActionStatuts(router, editorA, [
        { collectiviteId: collectiviteA.id, actionId: ECI_SOUS_ACTION_ID },
      ]);

      const caller = router.createCaller({ user: readerA });
      const { items } = await caller.referentiels.historique.list(
        baseInput(collectiviteA.id)
      );

      const actionStatutItems = items.filter(
        (i): i is HistoriqueActionStatutItem => i.type === 'action_statut'
      );
      const byId = Object.fromEntries(
        actionStatutItems.map((i) => [i.actionId, i])
      );
      expect(byId[TACHE_ACTION_ID]?.actionType).toBe(ActionTypeEnum.TACHE);
      expect(byId[SOUS_ACTION_ID]?.actionType).toBe(ActionTypeEnum.SOUS_ACTION);
      expect(byId[ECI_SOUS_ACTION_ID]?.actionType).toBe(
        ActionTypeEnum.SOUS_ACTION
      );
    });

    test("filtre par actionId inclut l'action et ses descendants", async () => {
      await seedHistoriqueActionStatuts(router, editorA, [
        // cae_1.1.1.1.2 → descendant de cae_1.1
        { collectiviteId: collectiviteA.id, actionId: TACHE_ACTION_ID },
        // hors du préfixe cae_1.1
        { collectiviteId: collectiviteA.id, actionId: 'cae_1.2.2.1.1' },
      ]);

      const caller = router.createCaller({ user: readerA });
      const { items } = await caller.referentiels.historique.list({
        collectiviteId: collectiviteA.id,
        actionId: 'cae_1.1',
        filters: {},
      });

      expect(items).toHaveLength(1);
      assertHistoriqueType(items[0], 'action_statut');
      expect(items[0].actionId).toBe(TACHE_ACTION_ID);
    });

    test("filtre par actionId est ancré sur le séparateur '.' : 'cae_1.1' ne remonte pas 'cae_1.10'", async () => {
      // On insère directement dans historique.action_statut pour pouvoir
      // utiliser un actionId ('cae_1.10') qui n'est pas forcément seedé
      // dans action_definition. La table historique n'a pas de FK
      // contraignante au niveau DB sur action_id (cf. domain `action_id`
      // = varchar(30)), donc ces insertions sont possibles.
      await databaseService.db.insert(historiqueActionStatutTable).values([
        {
          collectiviteId: collectiviteA.id,
          actionId: 'cae_1.1',
          avancement: 'fait',
          concerne: true,
          modifiedBy: editorA.id,
          modifiedAt: new Date(Date.UTC(2025, 0, 1, 0, 0, 1)).toISOString(),
        },
        {
          collectiviteId: collectiviteA.id,
          actionId: 'cae_1.10',
          avancement: 'fait',
          concerne: true,
          modifiedBy: editorA.id,
          modifiedAt: new Date(Date.UTC(2025, 0, 1, 0, 0, 2)).toISOString(),
        },
      ]);

      const caller = router.createCaller({ user: readerA });
      const { items, total } = await caller.referentiels.historique.list({
        collectiviteId: collectiviteA.id,
        actionId: 'cae_1.1',
        filters: {},
      });

      // Seule la ligne `cae_1.1` doit remonter ; `cae_1.10` ne matche ni
      // l'égalité exacte ni le pattern dot-ancré `cae_1.1.%`.
      expect(total).toBe(1);
      expect(items).toHaveLength(1);
      assertHistoriqueType(items[0], 'action_statut');
      expect(items[0].actionId).toBe('cae_1.1');
    });

    test("filtre par actionId : la branche LIKE dot-ancrée matche les descendants mais ignore les descendants d'un sibling", async () => {
      // Seed direct sans passer par updateStatuts → `actionIds` reste null,
      // donc seul le LIKE peut matcher (la branche `actionIds @> ARRAY[...]`
      // ne joue pas). Pin la regression sur la branche LIKE seule :
      // - `cae_1.1.5.2.3`     descendant de `cae_1.1`  → DOIT matcher
      // - `cae_1.10.5.2.3`    descendant de `cae_1.10` → NE doit PAS matcher
      await databaseService.db.insert(historiqueActionStatutTable).values([
        {
          collectiviteId: collectiviteA.id,
          actionId: 'cae_1.1.5.2.3',
          avancement: 'fait',
          concerne: true,
          modifiedBy: editorA.id,
          modifiedAt: new Date(Date.UTC(2025, 0, 2, 0, 0, 1)).toISOString(),
        },
        {
          collectiviteId: collectiviteA.id,
          actionId: 'cae_1.10.5.2.3',
          avancement: 'fait',
          concerne: true,
          modifiedBy: editorA.id,
          modifiedAt: new Date(Date.UTC(2025, 0, 2, 0, 0, 2)).toISOString(),
        },
      ]);

      const caller = router.createCaller({ user: readerA });
      const { items, total } = await caller.referentiels.historique.list({
        collectiviteId: collectiviteA.id,
        actionId: 'cae_1.1',
        filters: {},
      });

      expect(total).toBe(1);
      expect(items).toHaveLength(1);
      assertHistoriqueType(items[0], 'action_statut');
      expect(items[0].actionId).toBe('cae_1.1.5.2.3');
    });

    test('filtre par modifiedBy', async () => {
      await seedHistoriqueActionStatuts(router, editorA, [
        { collectiviteId: collectiviteA.id, actionId: TACHE_ACTION_ID },
      ]);
      await seedHistoriqueActionStatuts(router, adminA, [
        { collectiviteId: collectiviteA.id, actionId: SOUS_ACTION_ID },
      ]);

      const caller = router.createCaller({ user: readerA });
      const { items } = await caller.referentiels.historique.list({
        collectiviteId: collectiviteA.id,
        filters: { modifiedBy: [editorA.id] },
      });

      expect(items).toHaveLength(1);
      expect(items[0].modifiedById).toBe(editorA.id);
    });

    test('isole les collectivités : seules les lignes de la collectivité demandée sont renvoyées', async () => {
      await seedHistoriqueActionStatuts(router, editorA, [
        { collectiviteId: collectiviteA.id, actionId: TACHE_ACTION_ID },
      ]);
      await seedHistoriqueActionStatuts(router, editorB, [
        { collectiviteId: collectiviteB.id, actionId: SOUS_ACTION_ID },
      ]);

      const readerACaller = router.createCaller({ user: readerA });
      const { items: itemsA, total: totalA } =
        await readerACaller.referentiels.historique.list(
          baseInput(collectiviteA.id)
        );

      expect(totalA).toBe(1);
      expect(itemsA).toHaveLength(1);
      expect(itemsA[0].collectiviteId).toBe(collectiviteA.id);
      assertHistoriqueType(itemsA[0], 'action_statut');
      expect(itemsA[0].actionId).toBe(TACHE_ACTION_ID);

      const readerBCaller = router.createCaller({ user: readerB });
      const { items: itemsB, total: totalB } =
        await readerBCaller.referentiels.historique.list(
          baseInput(collectiviteB.id)
        );
      expect(totalB).toBe(1);
      expect(itemsB[0].collectiviteId).toBe(collectiviteB.id);
      assertHistoriqueType(itemsB[0], 'action_statut');
      expect(itemsB[0].actionId).toBe(SOUS_ACTION_ID);
    });

    // #3 — Non-member rejection (P1)
    test('rejette un non-membre sur list', async () => {
      const readerBCaller = router.createCaller({ user: readerB });
      await expect(() =>
        readerBCaller.referentiels.historique.list(baseInput(collectiviteA.id))
      ).rejects.toThrowError(/droits insuffisants/i);
    });

    // #6 — Malformed action_id catch path (P2)
    test("safeGetActionType renvoie null pour un actionId trop profond et n'écroule pas la requête", async () => {
      // Profondeur 7 (cae_1.2.3.4.5.6.7) > la profondeur max d'un référentiel
      // CAE (6 niveaux : referentiel/axe/sous-axe/action/sous-action/tache).
      // `getActionTypeFromActionId` doit lever, et `safeGetActionType`
      // doit attraper l'erreur et renvoyer null.
      const malformedActionId = 'cae_1.2.3.4.5.6.7';

      // Le FK historique_action_statut.action_id → action_relation.id et
      // action_definition.action_id → action_relation.id imposent de seeder
      // action_relation EN PREMIER, puis action_definition.
      await databaseService.db
        .insert(actionRelationTable)
        .values({
          id: malformedActionId,
          referentiel: 'cae',
          parent: null,
        })
        .onConflictDoNothing();
      await databaseService.db
        .insert(actionDefinitionTable)
        .values({
          actionId: malformedActionId,
          referentiel: 'cae',
          referentielId: 'cae',
          referentielVersion: '1.0.0',
          identifiant: '1.2.3.4.5.6.7',
          nom: 'Action factice profondeur 7',
          description: '',
          contexte: '',
          exemples: '',
          ressources: '',
          reductionPotentiel: '',
          perimetreEvaluation: '',
        })
        .onConflictDoNothing();

      try {
        await databaseService.db.insert(historiqueActionStatutTable).values({
          collectiviteId: collectiviteA.id,
          actionId: malformedActionId,
          avancement: 'fait',
          concerne: true,
          modifiedBy: editorA.id,
          modifiedAt: '2025-04-01 12:00:00+00',
        });

        const caller = router.createCaller({ user: readerA });
        const { items } = await caller.referentiels.historique.list(
          baseInput(collectiviteA.id)
        );

        const malformed = items.find(
          (i): i is HistoriqueActionStatutItem =>
            i.type === 'action_statut' && i.actionId === malformedActionId
        );
        expect(malformed).toBeDefined();
        expect(malformed?.actionType).toBeNull();
      } finally {
        // Nettoyage local en ordre FK inverse :
        // historique → action_definition → action_relation.
        await databaseService.db
          .delete(historiqueActionStatutTable)
          .where(eq(historiqueActionStatutTable.actionId, malformedActionId));
        await databaseService.db
          .delete(actionDefinitionTable)
          .where(eq(actionDefinitionTable.actionId, malformedActionId));
        await databaseService.db
          .delete(actionRelationTable)
          .where(eq(actionRelationTable.id, malformedActionId));
      }
    });

    // #7 — endDate boundary (P2)
    test('endDate inclut toute la journée (sémantique `${endDate} 24:00`)', async () => {
      // Deux insertions explicites pour contrôler `modified_at` à la
      // seconde près. On évite la mutation tRPC qui force CURRENT_TIMESTAMP.
      await databaseService.db.insert(historiqueActionStatutTable).values([
        {
          collectiviteId: collectiviteA.id,
          actionId: TACHE_ACTION_ID,
          avancement: 'fait',
          concerne: true,
          modifiedBy: editorA.id,
          modifiedAt: '2025-03-15 23:59:59+00',
        },
        {
          collectiviteId: collectiviteA.id,
          actionId: SOUS_ACTION_ID,
          avancement: 'fait',
          concerne: true,
          modifiedBy: editorA.id,
          modifiedAt: '2025-03-16 00:00:00+00',
        },
      ]);

      const caller = router.createCaller({ user: readerA });
      const { items } = await caller.referentiels.historique.list({
        collectiviteId: collectiviteA.id,
        filters: { endDate: '2025-03-15' },
      });

      expect(items).toHaveLength(1);
      assertHistoriqueType(items[0], 'action_statut');
      expect(items[0].actionId).toBe(TACHE_ACTION_ID);
    });

    // #10 — Pagination + total (P2)
    test('pagination renvoie pageSize items et un total cohérent sur deux pages', async () => {
      const pageSize = NB_HISTORIQUE_ITEMS_PER_PAGE;
      const totalRows = pageSize + 2;

      // On seede `pageSize + 2` lignes via insert direct pour aller vite.
      // L'`actionId` n'a pas besoin d'être unique pour ce test.
      await databaseService.db.insert(historiqueActionStatutTable).values(
        Array.from({ length: totalRows }).map((_, i) => ({
          collectiviteId: collectiviteA.id,
          actionId: TACHE_ACTION_ID,
          avancement: 'fait' as const,
          concerne: true,
          modifiedBy: editorA.id,
          // Décalage pour garantir un ordre stable sur modified_at desc.
          modifiedAt: new Date(
            Date.UTC(2025, 0, 1, 0, 0, totalRows - i)
          ).toISOString(),
        }))
      );

      const caller = router.createCaller({ user: readerA });

      const { items: page1, total: total1 } =
        await caller.referentiels.historique.list({
          collectiviteId: collectiviteA.id,
          filters: { page: 1 },
        });
      expect(total1).toBe(totalRows);
      expect(page1).toHaveLength(pageSize);

      const { items: page2, total: total2 } =
        await caller.referentiels.historique.list({
          collectiviteId: collectiviteA.id,
          filters: { page: 2 },
        });
      expect(total2).toBe(totalRows);
      expect(page2).toHaveLength(2);
    });

    // #21 — types filter (P3)
    test('filtre par types : `action_statut` ne renvoie que les statuts', async () => {
      await seedHistoriqueActionStatuts(router, editorA, [
        { collectiviteId: collectiviteA.id, actionId: TACHE_ACTION_ID },
      ]);
      await seedHistoriqueActionCommentaire(router, editorA, {
        collectiviteId: collectiviteA.id,
        actionId: SOUS_ACTION_ID,
        commentaire: 'Précision test',
      });
      await seedHistoriqueReponse(router, editorA, {
        collectiviteId: collectiviteA.id,
        questionId: TEST_QUESTION_BINAIRE_ID,
        reponse: true,
      });
      await seedHistoriqueJustification(router, editorA, {
        collectiviteId: collectiviteA.id,
        questionId: TEST_QUESTION_BINAIRE_ID,
        texte: 'Justification test',
      });

      const caller = router.createCaller({ user: readerA });
      const { items } = await caller.referentiels.historique.list({
        collectiviteId: collectiviteA.id,
        filters: { types: ['action_statut'] },
      });

      expect(items).toHaveLength(1);
      assertHistoriqueType(items[0], 'action_statut');
    });

    // #22 — modifiedAt desc ordering (P3)
    test('ordonne les items par modifiedAt décroissant', async () => {
      await databaseService.db.insert(historiqueActionStatutTable).values([
        {
          collectiviteId: collectiviteA.id,
          actionId: TACHE_ACTION_ID,
          avancement: 'fait',
          concerne: true,
          modifiedBy: editorA.id,
          modifiedAt: '2025-03-01 00:00:00+00',
        },
        {
          collectiviteId: collectiviteA.id,
          actionId: SOUS_ACTION_ID,
          avancement: 'fait',
          concerne: true,
          modifiedBy: editorA.id,
          modifiedAt: '2025-03-15 00:00:00+00',
        },
      ]);

      const caller = router.createCaller({ user: readerA });
      const { items } = await caller.referentiels.historique.list(
        baseInput(collectiviteA.id)
      );

      expect(items).toHaveLength(2);
      // Non-strictement décroissant sur tout le tableau.
      for (let i = 0; i < items.length - 1; i++) {
        expect(new Date(items[i].modifiedAt).getTime()).toBeGreaterThanOrEqual(
          new Date(items[i + 1].modifiedAt).getTime()
        );
      }
      assertHistoriqueType(items[0], 'action_statut');
      assertHistoriqueType(items[1], 'action_statut');
      expect(items[0].actionId).toBe(SOUS_ACTION_ID);
      expect(items[1].actionId).toBe(TACHE_ACTION_ID);
    });
  });

  describe('listUtilisateurs', () => {
    const baseInput = (collectiviteId: number): ListUtilisateursInput => ({
      collectiviteId,
    });

    test('rejette un appel non authentifié', async () => {
      const caller = router.createCaller({ user: null });
      await expect(() =>
        caller.referentiels.historique.listUtilisateurs(
          baseInput(collectiviteA.id)
        )
      ).rejects.toThrowError(/not authenticated/i);
    });

    test('retourne les contributeurs distincts de la collectivité', async () => {
      await seedHistoriqueActionStatuts(router, editorA, [
        { collectiviteId: collectiviteA.id, actionId: TACHE_ACTION_ID },
      ]);
      // Contribution sur une autre collectivité : ne doit pas apparaître ici.
      await seedHistoriqueActionStatuts(router, editorB, [
        { collectiviteId: collectiviteB.id, actionId: TACHE_ACTION_ID },
      ]);

      const readerACaller = router.createCaller({ user: readerA });
      const utilisateurs =
        await readerACaller.referentiels.historique.listUtilisateurs(
          baseInput(collectiviteA.id)
        );

      expect(utilisateurs.map((u) => u.modifiedById)).toContain(editorA.id);
      expect(utilisateurs.map((u) => u.modifiedById)).not.toContain(editorB.id);
    });

    // #3 — Non-member rejection (P1)
    test('rejette un non-membre sur listUtilisateurs', async () => {
      const readerBCaller = router.createCaller({ user: readerB });
      await expect(() =>
        readerBCaller.referentiels.historique.listUtilisateurs(
          baseInput(collectiviteA.id)
        )
      ).rejects.toThrowError(/droits insuffisants/i);
    });

    // #23 — Dedup d'un utilisateur contribuant sur plusieurs sources
    test('dédoublonne un utilisateur contribuant sur plusieurs sources', async () => {
      await seedHistoriqueActionStatuts(router, editorA, [
        { collectiviteId: collectiviteA.id, actionId: TACHE_ACTION_ID },
      ]);
      await seedHistoriqueActionCommentaire(router, editorA, {
        collectiviteId: collectiviteA.id,
        actionId: SOUS_ACTION_ID,
        commentaire: 'Précision test dedup',
      });

      const readerACaller = router.createCaller({ user: readerA });
      const utilisateurs =
        await readerACaller.referentiels.historique.listUtilisateurs(
          baseInput(collectiviteA.id)
        );

      const matchingEditor = utilisateurs.filter(
        (u) => u.modifiedById === editorA.id
      );
      expect(matchingEditor).toHaveLength(1);
    });
  });
});
