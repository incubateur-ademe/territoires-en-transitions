import { ficheActionBudgetTable } from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';
import { ficheActionNoteTable } from '@/backend/plans/fiches/fiche-action-note/fiche-action-note.table';
import { axeTable } from '@/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionIndicateurTable } from '@/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionPiloteTable } from '@/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { ficheActionTable } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';

describe('CompletionAnalyticsRouter tests', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let databaseService: DatabaseService;
  let testPlanId: number;
  let testCollectiviteId: number;

  // In october 2025, product team defined these fields as the most important to complete for a plan.
  const FIELDS_TO_COMPLETE = [
    'titre',
    'description',
    'statut',
    'objectifs',
    'pilotes',
    'indicateurs',
    'budgets',
    'suiviRecent',
  ];

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
    const app = await getTestApp();
    databaseService = await getTestDatabase(app);
  });

  beforeEach(async () => {
    // Créer une collectivité de test
    const [collectivite] = await databaseService.db
      .insert(axeTable)
      .values({
        nom: 'Test Collectivité',
        collectiviteId: 999,
      })
      .returning();
    testCollectiviteId = collectivite.id;

    // Créer un plan de test
    const [plan] = await databaseService.db
      .insert(axeTable)
      .values({
        nom: 'Test Plan',
        collectiviteId: testCollectiviteId,
        plan: testCollectiviteId,
      })
      .returning();
    testPlanId = plan.id;

    onTestFinished(async () => {
      try {
        await databaseService.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.collectiviteId, testCollectiviteId));
        await databaseService.db
          .delete(axeTable)
          .where(eq(axeTable.id, testPlanId));
        await databaseService.db
          .delete(axeTable)
          .where(eq(axeTable.id, testCollectiviteId));
      } catch (error) {
        console.error('Erreur lors du nettoyage:', error);
      }
    });
  });

  describe('getFieldsToComplete', () => {
    it('should return empty array for plan with no fiches', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const result = await caller.plans.completionAnalytics.getFieldsToComplete(
        {
          planId: testPlanId,
        }
      );

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should return all fields for plan with completely empty fiches', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      // Create empty fiches
      const [fiche1] = await databaseService.db
        .insert(ficheActionTable)
        .values({
          titre: null,
          statut: null,
          collectiviteId: testCollectiviteId,
        })
        .returning();

      const [fiche2] = await databaseService.db
        .insert(ficheActionTable)
        .values({
          titre: null,
          statut: null,
          collectiviteId: testCollectiviteId,
        })
        .returning();

      // Associate fiches to the plan
      await databaseService.db.insert(ficheActionAxeTable).values([
        { ficheId: fiche1.id, axeId: testPlanId },
        { ficheId: fiche2.id, axeId: testPlanId },
      ]);

      const result = await caller.plans.completionAnalytics.getFieldsToComplete(
        {
          planId: testPlanId,
        }
      );

      expect(result).toHaveLength(FIELDS_TO_COMPLETE.length);

      const resultMap = new Map(
        result.map((field) => [field.name, field.count])
      );
      expect(resultMap.get('titre')).toBe(2);
      expect(resultMap.get('description')).toBe(2);
      expect(resultMap.get('statut')).toBe(2);
      expect(resultMap.get('objectifs')).toBe(2);
      expect(resultMap.get('pilotes')).toBe(2);
      expect(resultMap.get('indicateurs')).toBe(2);
      expect(resultMap.get('budgets')).toBe(2);
      expect(resultMap.get('suiviRecent')).toBe(2);
    });

    it('should return only incomplete fields for partially completed fiches', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      // Create a partially completed fiche
      const [fiche] = await databaseService.db
        .insert(ficheActionTable)
        .values({
          titre: 'Titre complet',
          description: 'Description complète',
          statut: 'En cours',
          collectiviteId: testCollectiviteId,
        })
        .returning();

      // Add a pilot
      await databaseService.db.insert(ficheActionPiloteTable).values({
        ficheId: fiche.id,
        userId: yoloDodoUser.id,
      });

      // Associate the fiche to the plan
      await databaseService.db.insert(ficheActionAxeTable).values({
        ficheId: fiche.id,
        axeId: testPlanId,
      });

      const result = await caller.plans.completionAnalytics.getFieldsToComplete(
        {
          planId: testPlanId,
        }
      );

      // Should return only incomplete fields (objectifs, indicateurs, budgets, suiviRecent)
      expect(result).toHaveLength(4);

      const resultMap = new Map(
        result.map((field) => [field.name, field.count])
      );
      expect(resultMap.get('objectifs')).toBe(1);
      expect(resultMap.get('indicateurs')).toBe(1);
      expect(resultMap.get('budgets')).toBe(1);
      expect(resultMap.get('suiviRecent')).toBe(1);
    });

    it('should return empty array for fully completed fiches', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      // Create a fully completed fiche
      const [fiche] = await databaseService.db
        .insert(ficheActionTable)
        .values({
          titre: 'Titre complet',
          description: 'Description complète',
          statut: 'En cours',
          objectifs: 'Objectifs définis',
          collectiviteId: testCollectiviteId,
        })
        .returning();

      // Add a pilot
      await databaseService.db.insert(ficheActionPiloteTable).values({
        ficheId: fiche.id,
        userId: yoloDodoUser.id,
      });

      // Add an indicateur
      await databaseService.db.insert(ficheActionIndicateurTable).values({
        ficheId: fiche.id,
        indicateurId: 1,
      });

      // Add a budget
      await databaseService.db.insert(ficheActionBudgetTable).values({
        ficheId: fiche.id,
        type: 'investissement',
        unite: 'HT',
        budgetPrevisionnel: 1000,
      });

      // Add a recent note
      const recentDate = new Date();
      recentDate.setMonth(recentDate.getMonth() - 6);
      await databaseService.db.insert(ficheActionNoteTable).values({
        ficheId: fiche.id,
        dateNote: recentDate.toISOString().split('T')[0], // Format YYYY-MM-DD
        note: 'Note de suivi récente',
        modifiedAt: recentDate.toISOString(),
        modifiedBy: yoloDodoUser.id,
        createdBy: yoloDodoUser.id,
      });

      // Associate the fiche to the plan
      await databaseService.db.insert(ficheActionAxeTable).values({
        ficheId: fiche.id,
        axeId: testPlanId,
      });

      const result = await caller.plans.completionAnalytics.getFieldsToComplete(
        {
          planId: testPlanId,
        }
      );

      expect(result).toEqual([]);
    });

    it('should respect priority order when returning fields', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      // Create fiches with different missing fields
      const [fiche1] = await databaseService.db
        .insert(ficheActionTable)
        .values({
          titre: null,
          description: 'Description complète',
          statut: 'En cours',
          collectiviteId: testCollectiviteId,
        })
        .returning();

      const [fiche2] = await databaseService.db
        .insert(ficheActionTable)
        .values({
          titre: 'Titre complet',
          description: null,
          statut: null,
          objectifs: 'Objectifs définis',
          collectiviteId: testCollectiviteId,
        })
        .returning();

      // Associate fiches to plan
      await databaseService.db.insert(ficheActionAxeTable).values([
        { ficheId: fiche1.id, axeId: testPlanId },
        { ficheId: fiche2.id, axeId: testPlanId },
      ]);

      const result = await caller.plans.completionAnalytics.getFieldsToComplete(
        {
          planId: testPlanId,
        }
      );

      expect(result).toHaveLength(FIELDS_TO_COMPLETE.length);

      // Verify that the priority order is respected
      expect(result[0].name).toBe('titre');
      expect(result[0].count).toBe(1);
      expect(result[1].name).toBe('description');
      expect(result[1].count).toBe(1);
      expect(result[2].name).toBe('statut');
      expect(result[2].count).toBe(1);
      expect(result[3].name).toBe('pilotes');
      expect(result[3].count).toBe(2);
      expect(result[4].name).toBe('objectifs');
      expect(result[4].count).toBe(1);
      expect(result[5].name).toBe('indicateurs');
      expect(result[5].count).toBe(2);
      expect(result[6].name).toBe('budgets');
      expect(result[6].count).toBe(2);
      expect(result[7].name).toBe('suiviRecent');
      expect(result[7].count).toBe(2);
    });

    it('should handle multiple fiches with mixed completion levels', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      // Fiche 1: missing title and description
      const [fiche1] = await databaseService.db
        .insert(ficheActionTable)
        .values({
          titre: '',
          description: '',
          statut: 'En cours',
          objectifs: 'Objectifs définis',
          collectiviteId: testCollectiviteId,
        })
        .returning();

      // Fiche 2: missing status and pilots
      const [fiche2] = await databaseService.db
        .insert(ficheActionTable)
        .values({
          titre: 'Titre complet',
          description: 'Description complète',
          statut: null,
          objectifs: 'Objectifs définis',
          collectiviteId: testCollectiviteId,
        })
        .returning();

      // Fiche 3: complete
      const [fiche3] = await databaseService.db
        .insert(ficheActionTable)
        .values({
          titre: 'Titre complet',
          description: 'Description complète',
          statut: 'En cours',
          objectifs: 'Objectifs définis',
          collectiviteId: testCollectiviteId,
        })
        .returning();

      // Add pilot to the fiche 3
      await databaseService.db.insert(ficheActionPiloteTable).values({
        ficheId: fiche3.id,
        userId: yoloDodoUser.id,
      });

      // Associate all fiches to the plan
      await databaseService.db.insert(ficheActionAxeTable).values([
        { ficheId: fiche1.id, axeId: testPlanId },
        { ficheId: fiche2.id, axeId: testPlanId },
        { ficheId: fiche3.id, axeId: testPlanId },
      ]);

      const result = await caller.plans.completionAnalytics.getFieldsToComplete(
        {
          planId: testPlanId,
        }
      );

      // Based on real data, all fields except objectifs are incomplete
      expect(result).toHaveLength(7);

      const resultMap = new Map(
        result.map((field) => [field.name, field.count])
      );
      expect(resultMap.get('titre')).toBe(1); // Only fiche1 is missing the title
      expect(resultMap.get('description')).toBe(1); // Only fiche1 is missing the description
      expect(resultMap.get('statut')).toBe(1); // Only fiche2 is missing the status
      expect(resultMap.get('pilotes')).toBe(2); // fiche1 and fiche2 are missing the pilots
      expect(resultMap.get('indicateurs')).toBe(3); // All fiches are missing indicateurs
      expect(resultMap.get('budgets')).toBe(3); // All fiches are missing budgets
      expect(resultMap.get('suiviRecent')).toBe(3); // All fiches are missing recent notes
    });

    it('should handle fiches with old notes (not recent)', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const [fiche] = await databaseService.db
        .insert(ficheActionTable)
        .values({
          titre: 'Titre complet',
          description: 'Description complète',
          statut: 'En cours',
          objectifs: 'Objectifs définis',
          collectiviteId: testCollectiviteId,
        })
        .returning();

      // Add an old note (more than one year)
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2);
      await databaseService.db.insert(ficheActionNoteTable).values({
        ficheId: fiche.id,
        dateNote: oldDate.toISOString().split('T')[0], // Format YYYY-MM-DD
        note: 'Note ancienne',
        modifiedAt: oldDate.toISOString(),
        modifiedBy: yoloDodoUser.id,
        createdBy: yoloDodoUser.id,
      });

      // Associate the fiche to the plan
      await databaseService.db.insert(ficheActionAxeTable).values({
        ficheId: fiche.id,
        axeId: testPlanId,
      });

      const result = await caller.plans.completionAnalytics.getFieldsToComplete(
        {
          planId: testPlanId,
        }
      );

      // Should include 'suiviRecent' because the note is too old
      expect(result.some((field) => field.name === 'suiviRecent')).toBe(true);
    });
  });
});
