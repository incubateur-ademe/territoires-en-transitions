import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { actionImpactPanierTable } from '@tet/backend/plans/paniers/models/action-impact-panier.table';
import { actionImpactTable } from '@tet/backend/plans/paniers/models/action-impact.table';
import { panierTable } from '@tet/backend/plans/paniers/models/panier.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, inArray, sql } from 'drizzle-orm';
import { beforeAll, describe, expect, onTestFinished, test } from 'vitest';
import { axeTable } from '../../fiches/shared/models/axe.table';
import { ficheActionActionImpactTable } from '../../fiches/shared/models/fiche-action-action-impact.table';
import { ficheActionAxeTable } from '../../fiches/shared/models/fiche-action-axe.table';
import { ficheActionTable } from '../../fiches/shared/models/fiche-action.table';

const RANDOM_UUID_NEVER_EXISTS = '00000000-0000-0000-0000-000000000000';

describe('paniers.checkout', () => {
  let router: TrpcRouter;
  let db: DatabaseService;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let editorUserId: string;
  let actionImpactIdsForTests: number[];

  beforeAll(async () => {
    const app = await getTestApp();
    router = await app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const seedActions = await db.db
      .select({ id: actionImpactTable.id })
      .from(actionImpactTable)
      .orderBy(actionImpactTable.id)
      .limit(3);
    actionImpactIdsForTests = seedActions.map((row) => row.id);
    if (actionImpactIdsForTests.length < 2) {
      throw new Error(
        "Le seed test ne contient pas assez d'action_impact (besoin d'au moins 2)"
      );
    }

    const result = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = result.collectivite;
    editorUser = getAuthUserFromUserCredentials(result.user);
    editorUserId = result.user.id;

    return async () => {
      await cleanupAllAxesForCollectivite(db, collectivite.id);
      await result.cleanup();
    };
  });

  describe('Sad paths', () => {
    test('PANIER_INTROUVABLE quand le panierId ne correspond à aucun panier', async () => {
      const caller = router.createCaller({ user: editorUser });

      await expect(
        caller.plans.paniers.checkout({
          collectiviteId: collectivite.id,
          panierId: RANDOM_UUID_NEVER_EXISTS,
        })
      ).rejects.toThrow("Le panier demandé n'existe pas");
    });

    test('PANIER_VIDE quand le panier existe mais ne contient aucune action', async () => {
      const { panierId, cleanup } = await createPanier(db);
      onTestFinished(cleanup);

      const caller = router.createCaller({ user: editorUser });
      await expect(
        caller.plans.paniers.checkout({
          collectiviteId: collectivite.id,
          panierId,
        })
      ).rejects.toThrow('Le panier ne contient aucune action sélectionnée');
    });

    test('PANIER_NON_AUTORISE quand le panier appartient à une autre collectivité', async () => {
      const otherCollectiviteResult = await addTestCollectiviteAndUser(db, {
        user: { role: CollectiviteRole.ADMIN },
      });
      const otherCollectiviteId = otherCollectiviteResult.collectivite.id;
      onTestFinished(async () => {
        await cleanupAllAxesForCollectivite(db, otherCollectiviteId);
        await otherCollectiviteResult.cleanup();
      });

      const { panierId, cleanup } = await createPanier(db, {
        collectiviteId: otherCollectiviteId,
      });
      onTestFinished(cleanup);
      await addActionsToPanier(
        db,
        panierId,
        actionImpactIdsForTests.slice(0, 1)
      );

      const caller = router.createCaller({ user: editorUser });
      await expect(
        caller.plans.paniers.checkout({
          collectiviteId: collectivite.id,
          panierId,
        })
      ).rejects.toThrow(
        'Ce panier appartient à une autre collectivité et ne peut pas être validé ici'
      );
    });

    test('PLAN_NON_AUTORISE quand planId appartient à une autre collectivité', async () => {
      const otherCollectiviteResult = await addTestCollectiviteAndUser(db, {
        user: { role: CollectiviteRole.ADMIN },
      });
      const otherCollectiviteId = otherCollectiviteResult.collectivite.id;
      onTestFinished(async () => {
        await cleanupAllAxesForCollectivite(db, otherCollectiviteId);
        await otherCollectiviteResult.cleanup();
      });

      const [foreignPlan] = await db.db
        .insert(axeTable)
        .values({
          nom: 'Plan collectif étranger',
          collectiviteId: otherCollectiviteId,
          modifiedBy: otherCollectiviteResult.user.id,
        })
        .returning({ id: axeTable.id });
      const foreignPlanId = foreignPlan.id;
      onTestFinished(async () => {
        await cleanupAxeAndAttachedFiches(db, foreignPlanId);
      });

      const { panierId, cleanup } = await createPanier(db);
      onTestFinished(cleanup);
      await addActionsToPanier(
        db,
        panierId,
        actionImpactIdsForTests.slice(0, 1)
      );

      const caller = router.createCaller({ user: editorUser });
      await expect(
        caller.plans.paniers.checkout({
          collectiviteId: collectivite.id,
          panierId,
          planId: foreignPlanId,
        })
      ).rejects.toThrow(
        'Le plan fourni appartient à une autre collectivité et ne peut pas être utilisé'
      );

      const linkedFichesOnForeignPlan = await db.db
        .select({ ficheId: ficheActionAxeTable.ficheId })
        .from(ficheActionAxeTable)
        .where(eq(ficheActionAxeTable.axeId, foreignPlanId));
      expect(linkedFichesOnForeignPlan).toEqual([]);

      const remainingActions = await db.db
        .select({ actionId: actionImpactPanierTable.actionId })
        .from(actionImpactPanierTable)
        .where(eq(actionImpactPanierTable.panierId, panierId));
      expect(remainingActions.map((row) => row.actionId)).toEqual(
        actionImpactIdsForTests.slice(0, 1)
      );
    });

    test('PLAN_INTROUVABLE quand planId ne correspond à aucun plan', async () => {
      const { panierId, cleanup } = await createPanier(db);
      onTestFinished(cleanup);
      await addActionsToPanier(
        db,
        panierId,
        actionImpactIdsForTests.slice(0, 1)
      );

      const caller = router.createCaller({ user: editorUser });
      await expect(
        caller.plans.paniers.checkout({
          collectiviteId: collectivite.id,
          panierId,
          planId: 999999999,
        })
      ).rejects.toThrow(
        "Le plan demandé n'existe pas ou n'est pas un plan racine"
      );
    });

    test('PLAN_INTROUVABLE quand planId pointe vers un sous-axe au lieu d\'un plan racine', async () => {
      const [rootPlan] = await db.db
        .insert(axeTable)
        .values({
          nom: 'Plan racine',
          collectiviteId: collectivite.id,
          modifiedBy: editorUserId,
        })
        .returning({ id: axeTable.id });
      const rootPlanId = rootPlan.id;
      onTestFinished(async () => {
        await cleanupAxeAndAttachedFiches(db, rootPlanId);
      });

      const [subAxe] = await db.db
        .insert(axeTable)
        .values({
          nom: 'Sous-axe',
          collectiviteId: collectivite.id,
          parent: rootPlanId,
          plan: rootPlanId,
          modifiedBy: editorUserId,
        })
        .returning({ id: axeTable.id });
      const subAxeId = subAxe.id;
      onTestFinished(async () => {
        await cleanupAxeAndAttachedFiches(db, subAxeId);
      });

      const { panierId, cleanup } = await createPanier(db);
      onTestFinished(cleanup);
      await addActionsToPanier(
        db,
        panierId,
        actionImpactIdsForTests.slice(0, 1)
      );

      const caller = router.createCaller({ user: editorUser });
      await expect(
        caller.plans.paniers.checkout({
          collectiviteId: collectivite.id,
          panierId,
          planId: subAxeId,
        })
      ).rejects.toThrow(
        "Le plan demandé n'existe pas ou n'est pas un plan racine"
      );
    });

    test("UNAUTHORIZED quand l'utilisateur n'a que le droit de lecture", async () => {
      const lectureResult = await addTestUser(db, {
        collectiviteId: collectivite.id,
        role: CollectiviteRole.LECTURE,
      });
      onTestFinished(lectureResult.cleanup);

      const { panierId, cleanup } = await createPanier(db);
      onTestFinished(cleanup);
      await addActionsToPanier(
        db,
        panierId,
        actionImpactIdsForTests.slice(0, 1)
      );

      const lectureUser = getAuthUserFromUserCredentials(lectureResult.user);
      const caller = router.createCaller({ user: lectureUser });

      await expect(
        caller.plans.paniers.checkout({
          collectiviteId: collectivite.id,
          panierId,
        })
      ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
    });
  });

  describe('Erreur serveur et rollback transactionnel', () => {
    test('createFiche échoue (titre > 300) → rollback complet, panier inchangé', async () => {
      // Le seed test insère des action_impact avec des id explicites sans bumper
      // la sequence. On la resynchronise avant l'insert pour éviter une collision.
      await db.db.execute(
        sql`SELECT setval('action_impact_id_seq', (SELECT max(id) FROM action_impact))`
      );

      const longTitre = 'a'.repeat(301);
      const [insertedAction] = await db.db
        .insert(actionImpactTable)
        .values({
          titre: longTitre,
          description: 'Action piégée pour le test de rollback',
        })
        .returning({ id: actionImpactTable.id });
      const trapActionId = insertedAction.id;

      onTestFinished(async () => {
        await db.db
          .delete(actionImpactTable)
          .where(eq(actionImpactTable.id, trapActionId));
      });

      const { panierId, cleanup } = await createPanier(db);
      onTestFinished(cleanup);
      await addActionsToPanier(db, panierId, [trapActionId]);

      const caller = router.createCaller({ user: editorUser });
      await expect(
        caller.plans.paniers.checkout({
          collectiviteId: collectivite.id,
          panierId,
        })
      ).rejects.toThrow("La création d'une fiche action a échoué");

      // Vérifie le rollback : le panier n'a pas été vidé
      const remainingActions = await db.db
        .select({ actionId: actionImpactPanierTable.actionId })
        .from(actionImpactPanierTable)
        .where(eq(actionImpactPanierTable.panierId, panierId));
      expect(remainingActions.map((row) => row.actionId)).toEqual([
        trapActionId,
      ]);

      // Aucun nouvel axe n'a été créé pour la collectivité
      const axesAfter = await db.db
        .select({ id: axeTable.id })
        .from(axeTable)
        .where(eq(axeTable.collectiviteId, collectivite.id));
      expect(axesAfter).toEqual([]);
    });
  });

  describe('Happy paths', () => {
    test('Création de plan : panier non lié, sans planId', async () => {
      const { panierId, cleanup } = await createPanier(db);
      onTestFinished(cleanup);
      await addActionsToPanier(
        db,
        panierId,
        actionImpactIdsForTests.slice(0, 2)
      );

      const caller = router.createCaller({ user: editorUser });
      const { planId } = await caller.plans.paniers.checkout({
        collectiviteId: collectivite.id,
        panierId,
      });

      onTestFinished(async () => {
        await cleanupAxeAndAttachedFiches(db, planId);
      });

      // Plan créé avec le bon nom et la bonne collectivité
      const [createdPlan] = await db.db
        .select()
        .from(axeTable)
        .where(eq(axeTable.id, planId));
      expect(createdPlan).toMatchObject({
        nom: "Plan d'action à impact",
        collectiviteId: collectivite.id,
      });
      await assertPlanLinkedToPanier(db, planId, panierId);

      // 2 fiches rattachées au plan
      const ficheLinks = await db.db
        .select({ ficheId: ficheActionAxeTable.ficheId })
        .from(ficheActionAxeTable)
        .where(eq(ficheActionAxeTable.axeId, planId));
      expect(ficheLinks).toHaveLength(2);

      // Lien vers les action_impact source maintenu
      const actionLinks = await db.db
        .select({
          actionImpactId: ficheActionActionImpactTable.actionImpactId,
        })
        .from(ficheActionActionImpactTable)
        .where(
          inArray(
            ficheActionActionImpactTable.ficheId,
            ficheLinks.map((link) => link.ficheId)
          )
        );
      expect(actionLinks.map((row) => row.actionImpactId).sort()).toEqual(
        actionImpactIdsForTests.slice(0, 2).sort()
      );

      // Panier vidé des actions matérialisées
      const remainingActions = await db.db
        .select({ actionId: actionImpactPanierTable.actionId })
        .from(actionImpactPanierTable)
        .where(eq(actionImpactPanierTable.panierId, panierId));
      expect(remainingActions).toEqual([]);
    });

    test('Upsert de plan : planId existant fourni → fiches ajoutées sans nouvel axe', async () => {
      // Crée un axe existant directement en DB
      const [existingPlan] = await db.db
        .insert(axeTable)
        .values({
          nom: 'Plan déjà existant',
          collectiviteId: collectivite.id,
          modifiedBy: editorUserId,
        })
        .returning({ id: axeTable.id });
      const existingPlanId = existingPlan.id;

      onTestFinished(async () => {
        await cleanupAxeAndAttachedFiches(db, existingPlanId);
      });

      const { panierId, cleanup } = await createPanier(db);
      onTestFinished(cleanup);
      await addActionsToPanier(
        db,
        panierId,
        actionImpactIdsForTests.slice(0, 2)
      );

      const axesBeforeCheckout = await db.db
        .select({ id: axeTable.id })
        .from(axeTable)
        .where(eq(axeTable.collectiviteId, collectivite.id));
      const idsBefore = axesBeforeCheckout.map((row) => row.id);
      expect(idsBefore).toContain(existingPlanId);

      const caller = router.createCaller({ user: editorUser });
      const { planId } = await caller.plans.paniers.checkout({
        collectiviteId: collectivite.id,
        panierId,
        planId: existingPlanId,
      });

      // Le planId retourné est exactement celui qu'on a passé
      expect(planId).toEqual(existingPlanId);

      // Aucun nouvel axe n'a été créé
      const axesAfterCheckout = await db.db
        .select({ id: axeTable.id })
        .from(axeTable)
        .where(eq(axeTable.collectiviteId, collectivite.id));
      expect(axesAfterCheckout.map((row) => row.id).sort()).toEqual(
        idsBefore.sort()
      );

      await assertPlanLinkedToPanier(db, existingPlanId, panierId);

      // Les 2 fiches sont rattachées à l'axe existant
      const ficheLinks = await db.db
        .select({ ficheId: ficheActionAxeTable.ficheId })
        .from(ficheActionAxeTable)
        .where(eq(ficheActionAxeTable.axeId, existingPlanId));
      expect(ficheLinks).toHaveLength(2);
    });
  });
});

async function createPanier(
  db: DatabaseService,
  options: { collectiviteId?: number } = {}
): Promise<{ panierId: string; cleanup: () => Promise<void> }> {
  const [panier] = await db.db
    .insert(panierTable)
    .values({
      collectiviteId: options.collectiviteId ?? null,
    })
    .returning({ id: panierTable.id });

  const panierId = panier.id;
  const cleanup = async () => {
    await db.db
      .update(axeTable)
      .set({ panierId: null })
      .where(sql`panier_id = ${panierId}::uuid`);
    await db.db
      .delete(actionImpactPanierTable)
      .where(eq(actionImpactPanierTable.panierId, panierId));
    await db.db.delete(panierTable).where(eq(panierTable.id, panierId));
  };

  return { panierId, cleanup };
}

async function addActionsToPanier(
  db: DatabaseService,
  panierId: string,
  actionIds: number[]
): Promise<void> {
  if (actionIds.length === 0) return;
  await db.db.insert(actionImpactPanierTable).values(
    actionIds.map((actionId) => ({
      panierId,
      actionId,
    }))
  );
}

async function cleanupAxeAndAttachedFiches(
  db: DatabaseService,
  axeId: number
): Promise<void> {
  const ficheLinks = await db.db
    .select({ ficheId: ficheActionAxeTable.ficheId })
    .from(ficheActionAxeTable)
    .where(eq(ficheActionAxeTable.axeId, axeId));
  const ficheIds = ficheLinks.map((row) => row.ficheId);

  await db.db
    .delete(ficheActionAxeTable)
    .where(eq(ficheActionAxeTable.axeId, axeId));

  if (ficheIds.length > 0) {
    await db.db
      .delete(ficheActionActionImpactTable)
      .where(inArray(ficheActionActionImpactTable.ficheId, ficheIds));
    await db.db
      .delete(ficheActionTable)
      .where(inArray(ficheActionTable.id, ficheIds));
  }

  await db.db.delete(axeTable).where(eq(axeTable.id, axeId));
}

async function cleanupAllAxesForCollectivite(
  db: DatabaseService,
  collectiviteId: number
): Promise<void> {
  const axes = await db.db
    .select({ id: axeTable.id })
    .from(axeTable)
    .where(eq(axeTable.collectiviteId, collectiviteId));
  for (const axe of axes) {
    await cleanupAxeAndAttachedFiches(db, axe.id);
  }
}

async function assertPlanLinkedToPanier(
  db: DatabaseService,
  planId: number,
  panierId: string
): Promise<void> {
  const [plan] = await db.db
    .select({ panierId: axeTable.panierId })
    .from(axeTable)
    .where(eq(axeTable.id, planId));
  expect(plan.panierId).toBe(panierId);
}
