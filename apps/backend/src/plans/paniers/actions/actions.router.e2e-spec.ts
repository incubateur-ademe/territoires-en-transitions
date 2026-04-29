import { actionImpactPanierTable } from '@tet/backend/plans/paniers/models/action-impact-panier.table';
import { actionImpactStatutTable } from '@tet/backend/plans/paniers/models/action-impact-statut.table';
import { actionImpactTable } from '@tet/backend/plans/paniers/models/action-impact.table';
import { panierTable } from '@tet/backend/plans/paniers/models/panier.table';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { and, eq, inArray } from 'drizzle-orm';
import { beforeAll, describe, expect, onTestFinished, test } from 'vitest';

const NON_EXISTENT_PANIER_ID = '00000000-0000-0000-0000-000000000000';

describe('paniers.actions', () => {
  let router: TrpcRouter;
  let db: DatabaseService;
  let actionImpactIdsForTests: number[];

  beforeAll(async () => {
    const app = await getTestApp();
    router = await app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const inserted = await db.db
      .insert(actionImpactTable)
      .values([
        { titre: 'Fixture panier actions e2e #1', description: '' },
        { titre: 'Fixture panier actions e2e #2', description: '' },
      ])
      .returning({ id: actionImpactTable.id });
    actionImpactIdsForTests = inserted.map((row) => row.id);

    return async () => {
      await db.db
        .delete(actionImpactTable)
        .where(inArray(actionImpactTable.id, actionImpactIdsForTests));
    };
  });

  describe('add', () => {
    test('ajoute une action dans un panier existant', async () => {
      const { panierId, cleanup } = await createPanier(db);
      onTestFinished(cleanup);
      const [actionId] = actionImpactIdsForTests;

      const caller = router.createCaller({ user: null });
      await caller.plans.paniers.actions.add({ panierId, actionId });

      const rows = await selectPanierActions(db, panierId);
      expect(rows).toEqual([{ actionId }]);
    });

    test('idempotent : un second add sur la même paire est un no-op', async () => {
      const { panierId, cleanup } = await createPanier(db);
      onTestFinished(cleanup);
      const [actionId] = actionImpactIdsForTests;

      const caller = router.createCaller({ user: null });
      await caller.plans.paniers.actions.add({ panierId, actionId });
      await caller.plans.paniers.actions.add({ panierId, actionId });

      const rows = await selectPanierActions(db, panierId);
      expect(rows).toEqual([{ actionId }]);
    });

    test("PANIER_NOT_FOUND quand le panier n'existe pas", async () => {
      const caller = router.createCaller({ user: null });
      const [actionId] = actionImpactIdsForTests;

      await expect(
        caller.plans.paniers.actions.add({
          panierId: NON_EXISTENT_PANIER_ID,
          actionId,
        })
      ).rejects.toThrow("Le panier demandé n'existe pas");
    });
  });

  describe('remove', () => {
    test('retire une action présente dans le panier', async () => {
      const { panierId, cleanup } = await createPanier(db);
      onTestFinished(cleanup);
      const [actionId, otherActionId] = actionImpactIdsForTests;
      await db.db.insert(actionImpactPanierTable).values([
        { panierId, actionId },
        { panierId, actionId: otherActionId },
      ]);

      const caller = router.createCaller({ user: null });
      await caller.plans.paniers.actions.remove({ panierId, actionId });

      const rows = await selectPanierActions(db, panierId);
      expect(rows).toEqual([{ actionId: otherActionId }]);
    });

    test('idempotent : remove sur une action absente est un no-op', async () => {
      const { panierId, cleanup } = await createPanier(db);
      onTestFinished(cleanup);
      const [actionId] = actionImpactIdsForTests;

      const caller = router.createCaller({ user: null });
      await caller.plans.paniers.actions.remove({ panierId, actionId });

      const rows = await selectPanierActions(db, panierId);
      expect(rows).toEqual([]);
    });

    test("PANIER_NOT_FOUND quand le panier n'existe pas", async () => {
      const caller = router.createCaller({ user: null });
      const [actionId] = actionImpactIdsForTests;

      await expect(
        caller.plans.paniers.actions.remove({
          panierId: NON_EXISTENT_PANIER_ID,
          actionId,
        })
      ).rejects.toThrow("Le panier demandé n'existe pas");
    });
  });

  describe('setStatus', () => {
    test("définit le statut quand aucun n'est encore renseigné", async () => {
      const { panierId, cleanup } = await createPanier(db);
      onTestFinished(cleanup);
      const [actionId] = actionImpactIdsForTests;

      const caller = router.createCaller({ user: null });
      await caller.plans.paniers.actions.setStatus({
        panierId,
        actionId,
        categorie: 'en_cours',
      });

      const rows = await selectPanierStatuts(db, panierId);
      expect(rows).toEqual([{ actionId, categorieId: 'en_cours' }]);
    });

    test('met à jour le statut existant (upsert)', async () => {
      const { panierId, cleanup } = await createPanier(db);
      onTestFinished(cleanup);
      const [actionId] = actionImpactIdsForTests;

      const caller = router.createCaller({ user: null });
      await caller.plans.paniers.actions.setStatus({
        panierId,
        actionId,
        categorie: 'en_cours',
      });
      await caller.plans.paniers.actions.setStatus({
        panierId,
        actionId,
        categorie: 'realise',
      });

      const rows = await selectPanierStatuts(db, panierId);
      expect(rows).toEqual([{ actionId, categorieId: 'realise' }]);
    });

    test("PANIER_NOT_FOUND quand le panier n'existe pas", async () => {
      const caller = router.createCaller({ user: null });
      const [actionId] = actionImpactIdsForTests;

      await expect(
        caller.plans.paniers.actions.setStatus({
          panierId: NON_EXISTENT_PANIER_ID,
          actionId,
          categorie: 'en_cours',
        })
      ).rejects.toThrow("Le panier demandé n'existe pas");
    });
  });

  describe('clearStatus', () => {
    test('retire le statut existant', async () => {
      const { panierId, cleanup } = await createPanier(db);
      onTestFinished(cleanup);
      const [actionId, otherActionId] = actionImpactIdsForTests;
      await db.db.insert(actionImpactStatutTable).values([
        { panierId, actionId, categorieId: 'en_cours' },
        { panierId, actionId: otherActionId, categorieId: 'realise' },
      ]);

      const caller = router.createCaller({ user: null });
      await caller.plans.paniers.actions.clearStatus({ panierId, actionId });

      const rows = await selectPanierStatuts(db, panierId);
      expect(rows).toEqual([
        { actionId: otherActionId, categorieId: 'realise' },
      ]);
    });

    test('idempotent : clearStatus sans statut existant est un no-op', async () => {
      const { panierId, cleanup } = await createPanier(db);
      onTestFinished(cleanup);
      const [actionId] = actionImpactIdsForTests;

      const caller = router.createCaller({ user: null });
      await caller.plans.paniers.actions.clearStatus({ panierId, actionId });

      const rows = await selectPanierStatuts(db, panierId);
      expect(rows).toEqual([]);
    });

    test("PANIER_NOT_FOUND quand le panier n'existe pas", async () => {
      const caller = router.createCaller({ user: null });
      const [actionId] = actionImpactIdsForTests;

      await expect(
        caller.plans.paniers.actions.clearStatus({
          panierId: NON_EXISTENT_PANIER_ID,
          actionId,
        })
      ).rejects.toThrow("Le panier demandé n'existe pas");
    });
  });
});

async function createPanier(
  db: DatabaseService
): Promise<{ panierId: string; cleanup: () => Promise<void> }> {
  const [panier] = await db.db
    .insert(panierTable)
    .values({})
    .returning({ id: panierTable.id });
  const panierId = panier.id;

  const cleanup = async () => {
    await db.db
      .delete(actionImpactStatutTable)
      .where(eq(actionImpactStatutTable.panierId, panierId));
    await db.db
      .delete(actionImpactPanierTable)
      .where(eq(actionImpactPanierTable.panierId, panierId));
    await db.db.delete(panierTable).where(eq(panierTable.id, panierId));
  };

  return { panierId, cleanup };
}

async function selectPanierActions(
  db: DatabaseService,
  panierId: string
): Promise<{ actionId: number }[]> {
  return db.db
    .select({ actionId: actionImpactPanierTable.actionId })
    .from(actionImpactPanierTable)
    .where(and(eq(actionImpactPanierTable.panierId, panierId)))
    .orderBy(actionImpactPanierTable.actionId);
}

async function selectPanierStatuts(
  db: DatabaseService,
  panierId: string
): Promise<{ actionId: number; categorieId: string }[]> {
  return db.db
    .select({
      actionId: actionImpactStatutTable.actionId,
      categorieId: actionImpactStatutTable.categorieId,
    })
    .from(actionImpactStatutTable)
    .where(eq(actionImpactStatutTable.panierId, panierId))
    .orderBy(actionImpactStatutTable.actionId);
}
