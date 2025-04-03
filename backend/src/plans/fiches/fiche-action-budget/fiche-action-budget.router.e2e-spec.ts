import { inferProcedureInput } from '@trpc/server';
import { AppRouter, TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { AuthenticatedUser } from '@/backend/auth/models/auth.models';
import { DatabaseService } from '@/backend/utils';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@/backend/test';
import { onTestFinished } from 'vitest';
import { ficheActionBudgetTable } from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';
import { eq } from 'drizzle-orm';

type upsertInput = inferProcedureInput<
  AppRouter['plans']['fiches']['budgets']['upsert']
>;

describe('Route CRUD des budgets des fiches actions', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
    const app = await getTestApp();
    databaseService = await getTestDatabase(app);
  });

  test(`Tests CRUD`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    // Crée jeu de test
    const ficheId = 1;
    const budgetHTInvTot: upsertInput = {
      ficheId: ficheId,
      type: 'investissement',
      unite: 'HT',
      budgetPrevisionnel: '5000',
      estEtale: true,
    };
    const budgetHTInvTotBis: upsertInput = {
      ...budgetHTInvTot,
      estEtale: false,
    };
    const budgetHTInv2020: upsertInput = {
      ficheId: ficheId,
      type: 'investissement',
      unite: 'HT',
      annee: 2020,
      budgetPrevisionnel: '5000',
      budgetReel: '5000',
    };
    const budgetHTInv2021: upsertInput = {
      ...budgetHTInv2020,
      annee: 2021,
    };

    const budgetHTFon2020: upsertInput = {
      ...budgetHTInv2020,
      type: 'fonctionnement',
    };

    const budgetETPInv2020: upsertInput = {
      ...budgetHTInv2020,
      unite: 'ETP',
    };

    const budgetHTInv2020Bis: upsertInput = {
      ...budgetHTInv2020,
      budgetReel: '6000',
    };

    // Ajoute jeu de test
    const upsertTot = await caller.plans.fiches.budgets.upsert(budgetHTInvTot);
    expect(upsertTot.id).not.toBeNull();
    expect(upsertTot.estEtale).toBe(true);
    const upsert2020 = await caller.plans.fiches.budgets.upsert(
      budgetHTInv2020
    );
    expect(upsert2020.id).not.toBeNull();
    expect(upsert2020.budgetReel).toBe('5000');
    await caller.plans.fiches.budgets.upsert(budgetHTInv2021);
    await caller.plans.fiches.budgets.upsert(budgetHTFon2020);
    await caller.plans.fiches.budgets.upsert(budgetETPInv2020);

    const result1 = await caller.plans.fiches.budgets.list({ ficheId });
    expect(result1.length).toBe(5);
    const result1Tot = await caller.plans.fiches.budgets.list({
      ficheId,
      total: true,
    });
    expect(result1Tot.length).toBe(1);
    expect(result1Tot[0].budgetPrevisionnel).toBe('5000');

    // Ajout conflits
    await expect(() =>
      caller.plans.fiches.budgets.upsert(budgetHTInvTotBis)
    ).rejects.toThrowError();
    await expect(() =>
      caller.plans.fiches.budgets.upsert(budgetHTInv2020Bis)
    ).rejects.toThrowError();

    const result2 = await caller.plans.fiches.budgets.list({ ficheId });
    expect(result2.length).toBe(5);

    // Update avec id
    const upsertTotBis = await caller.plans.fiches.budgets.upsert({
      ...upsertTot,
      estEtale: false,
    });
    expect(upsertTotBis.id).toBe(upsertTot.id);
    expect(upsertTotBis.estEtale).toBe(false);
    const upsert2020Bis = await caller.plans.fiches.budgets.upsert({
      ...upsert2020,
      budgetReel: 6000,
    });
    expect(upsert2020Bis.id).toBe(upsert2020.id);
    expect(upsert2020Bis.budgetReel).toBe('6000');

    const result3 = await caller.plans.fiches.budgets.list({ ficheId });
    expect(result3.length).toBe(5);

    // Test listes
    const resultHTInvTot = await caller.plans.fiches.budgets.list({
      ficheId,
      type: 'investissement',
      unite: 'HT',
      total: true,
    });
    expect(resultHTInvTot.length).toBe(1);

    const resultHTFonTot = await caller.plans.fiches.budgets.list({
      ficheId,
      type: 'fonctionnement',
      unite: 'HT',
      total: true,
    });
    expect(resultHTFonTot.length).toBe(0);

    const resultHTInv = await caller.plans.fiches.budgets.list({
      ficheId,
      type: 'investissement',
      unite: 'HT',
      total: false,
    });
    expect(resultHTInv.length).toBe(2);

    const resultHTFon = await caller.plans.fiches.budgets.list({
      ficheId,
      type: 'fonctionnement',
      unite: 'HT',
      total: false,
    });
    expect(resultHTFon.length).toBe(1);

    const resultETPInv = await caller.plans.fiches.budgets.list({
      ficheId,
      type: 'investissement',
      unite: 'ETP',
      total: false,
    });
    expect(resultETPInv.length).toBe(1);

    await expect(() =>
      caller.plans.fiches.budgets.list({ ficheId, type: 'erreur' })
    ).rejects.toThrowError();

    await expect(() =>
      caller.plans.fiches.budgets.list({ ficheId, unite: 'erreur' })
    ).rejects.toThrowError();

    // Suppression
    await caller.plans.fiches.budgets.delete({ budgetId: upsertTot.id });
    await caller.plans.fiches.budgets.delete({ budgetId: upsert2020.id });

    await expect(() =>
      caller.plans.fiches.budgets.delete({ budgetId: 2000 })
    ).rejects.toThrowError();

    const result4 = await caller.plans.fiches.budgets.list({ ficheId });
    expect(result4.length).toBe(3);

    onTestFinished(async () => {
      try {
        await databaseService.db
          .delete(ficheActionBudgetTable)
          .where(eq(ficheActionBudgetTable.ficheId, ficheId));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    });
  });
});
