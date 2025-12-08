import { ficheActionBudgetTable } from '@tet/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';
import { ficheActionNoteTable } from '@tet/backend/plans/fiches/fiche-action-note/fiche-action-note.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionIndicateurTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionPiloteTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { ORDERED_FIELDS_TO_CHECK_FOR_COMPLETION } from './domain/plan.completion-calculator';

const twoYearsAgo = new Date();
twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

const threeYearsAgo = new Date();
threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

describe('CompletionAnalyticsRouter tests', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let databaseService: DatabaseService;
  let testPlanId: number;
  let testCollectiviteId: number;

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

      const result = await caller.plans.getFieldsToComplete({
        planId: testPlanId,
      });

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
          createdAt: twoYearsAgo.toISOString(),
        })
        .returning();

      const [fiche2] = await databaseService.db
        .insert(ficheActionTable)
        .values({
          titre: null,
          statut: null,
          collectiviteId: testCollectiviteId,
          createdAt: twoYearsAgo.toISOString(),
        })
        .returning();

      await databaseService.db.insert(ficheActionNoteTable).values({
        ficheId: fiche1.id,
        dateNote: twoYearsAgo.toISOString(),
        note: 'Note plutôt ancienne',
        createdAt: twoYearsAgo.toISOString(),
        modifiedAt: twoYearsAgo.toISOString(),
        modifiedBy: yoloDodoUser.id,
        createdBy: yoloDodoUser.id,
      });

      await databaseService.db.insert(ficheActionNoteTable).values({
        ficheId: fiche2.id,
        dateNote: twoYearsAgo.toISOString(),
        note: 'Note plutôt ancienne',
        createdAt: twoYearsAgo.toISOString(),
        modifiedAt: twoYearsAgo.toISOString(),
        modifiedBy: yoloDodoUser.id,
        createdBy: yoloDodoUser.id,
      });
      // Associate fiches to the plan
      await databaseService.db.insert(ficheActionAxeTable).values([
        { ficheId: fiche1.id, axeId: testPlanId },
        { ficheId: fiche2.id, axeId: testPlanId },
      ]);

      const result = await caller.plans.getFieldsToComplete({
        planId: testPlanId,
      });

      expect(result.find((f) => f.name === 'titre')?.count).toBe(2);
      expect(result.find((f) => f.name === 'description')?.count).toBe(2);
      expect(result.find((f) => f.name === 'statut')?.count).toBe(2);
      expect(result.find((f) => f.name === 'objectifs')?.count).toBe(2);
      expect(result.find((f) => f.name === 'pilotes')?.count).toBe(2);
      expect(result.find((f) => f.name === 'indicateurs')?.count).toBe(2);
      expect(result.find((f) => f.name === 'budgets')?.count).toBe(2);
      expect(result.find((f) => f.name === 'suiviRecent')?.count).toBe(2);
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
          createdAt: twoYearsAgo.toISOString(),
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

      const result = await caller.plans.getFieldsToComplete({
        planId: testPlanId,
      });

      // Should return only incomplete fields (objectifs, indicateurs, budgets, suiviRecent)
      expect(result).toHaveLength(4);

      expect(result.find((f) => f.name === 'objectifs')?.count).toBe(1);
      expect(result.find((f) => f.name === 'indicateurs')?.count).toBe(1);
      expect(result.find((f) => f.name === 'budgets')?.count).toBe(1);
      expect(result.find((f) => f.name === 'suiviRecent')?.count).toBe(1);
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
          createdAt: twoYearsAgo.toISOString(),
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

      await databaseService.db.insert(ficheActionNoteTable).values({
        ficheId: fiche.id,
        dateNote: sixMonthsAgo.toISOString().split('T')[0], // Format YYYY-MM-DD
        note: 'Note récente',
        createdAt: sixMonthsAgo.toISOString(),
        modifiedAt: sixMonthsAgo.toISOString(),
        modifiedBy: yoloDodoUser.id,
        createdBy: yoloDodoUser.id,
      });

      // Associate the fiche to the plan
      await databaseService.db.insert(ficheActionAxeTable).values({
        ficheId: fiche.id,
        axeId: testPlanId,
      });

      const result = await caller.plans.getFieldsToComplete({
        planId: testPlanId,
      });

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
          createdAt: twoYearsAgo.toISOString(),
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
          createdAt: twoYearsAgo.toISOString(),
        })
        .returning();

      // Associate fiches to plan
      await databaseService.db.insert(ficheActionAxeTable).values([
        { ficheId: fiche1.id, axeId: testPlanId },
        { ficheId: fiche2.id, axeId: testPlanId },
      ]);

      const result = await caller.plans.getFieldsToComplete({
        planId: testPlanId,
      });

      expect(result).toHaveLength(
        ORDERED_FIELDS_TO_CHECK_FOR_COMPLETION.length
      );

      // Verify that the priority order is respected
      const expected = [
        { name: 'titre', count: 1 },
        { name: 'description', count: 1 },
        { name: 'statut', count: 1 },
        { name: 'pilotes', count: 2 },
        { name: 'objectifs', count: 1 },
        { name: 'indicateurs', count: 2 },
        { name: 'budgets', count: 2 },
        { name: 'suiviRecent', count: 2 },
      ];
      expect(result.map((f) => ({ name: f.name, count: f.count }))).toEqual(
        expected
      );
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
          createdAt: twoYearsAgo.toISOString(),
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
          createdAt: twoYearsAgo.toISOString(),
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
          createdAt: twoYearsAgo.toISOString(),
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

      const result = await caller.plans.getFieldsToComplete({
        planId: testPlanId,
      });

      expect(result.find((f) => f.name === 'titre')?.count).toBe(1);
      expect(result.find((f) => f.name === 'description')?.count).toBe(1);
      expect(result.find((f) => f.name === 'statut')?.count).toBe(1);
      expect(result.find((f) => f.name === 'pilotes')?.count).toBe(2);
      expect(result.find((f) => f.name === 'indicateurs')?.count).toBe(3);
      expect(result.find((f) => f.name === 'budgets')?.count).toBe(3);
      expect(result.find((f) => f.name === 'suiviRecent')?.count).toBe(3);
    });

    it('should only return fiches older than one year with notes older than one year', async () => {
      const caller = router.createCaller({ user: yoloDodoUser });

      const [oldFicheWithRecentNote, oldFicheWithOldNote, recentFiche] =
        await Promise.all([
          databaseService.db
            .insert(ficheActionTable)
            .values({
              titre: 'Titre complet',
              description: 'Description complète',
              statut: 'En cours',
              objectifs: 'Objectifs définis',
              collectiviteId: testCollectiviteId,
              createdAt: twoYearsAgo.toISOString(),
            })
            .returning()
            .then((rows) => rows[0]),
          databaseService.db
            .insert(ficheActionTable)
            .values({
              titre: 'Titre complet',
              description: 'Description complète',
              statut: 'En cours',
              objectifs: 'Objectifs définis',
              collectiviteId: testCollectiviteId,
              createdAt: twoYearsAgo.toISOString(),
            })
            .returning()
            .then((rows) => rows[0]),
          databaseService.db
            .insert(ficheActionTable)
            .values({
              titre: 'Titre complet',
              description: 'Description complète',
              statut: 'En cours',
              objectifs: 'Objectifs définis',
              collectiviteId: testCollectiviteId,
              createdAt: sixMonthsAgo.toISOString(),
            })
            .returning()
            .then((rows) => rows[0]),
        ]);

      await Promise.all([
        databaseService.db.insert(ficheActionNoteTable).values({
          ficheId: oldFicheWithOldNote.id,
          dateNote: '2024-01-01',
          note: 'Note ancienne',
          modifiedAt: twoYearsAgo.toISOString(),
          createdAt: twoYearsAgo.toISOString(),
          modifiedBy: yoloDodoUser.id,
          createdBy: yoloDodoUser.id,
        }),
        databaseService.db.insert(ficheActionNoteTable).values({
          ficheId: oldFicheWithRecentNote.id,
          dateNote: '2025-01-01',
          note: 'Note récente',
          modifiedAt: sixMonthsAgo.toISOString(),
          createdAt: threeYearsAgo.toISOString(),
          modifiedBy: yoloDodoUser.id,
          createdBy: yoloDodoUser.id,
        }),
        databaseService.db.insert(ficheActionNoteTable).values({
          ficheId: recentFiche.id,
          dateNote: '2025-06-01',
          note: 'Note récente',
          modifiedAt: sixMonthsAgo.toISOString(),
          createdAt: sixMonthsAgo.toISOString(),
          modifiedBy: yoloDodoUser.id,
          createdBy: yoloDodoUser.id,
        }),
      ]);
      // Associate the fiche to the plan
      await databaseService.db.insert(ficheActionAxeTable).values([
        { ficheId: recentFiche.id, axeId: testPlanId },
        { ficheId: oldFicheWithOldNote.id, axeId: testPlanId },
        { ficheId: oldFicheWithRecentNote.id, axeId: testPlanId },
      ]);

      const result = await caller.plans.getFieldsToComplete({
        planId: testPlanId,
      });

      const notesDeSuiviCompletion = result.find(
        (field) => field.name === 'suiviRecent'
      );
      expect(notesDeSuiviCompletion).toBeDefined();
      if (notesDeSuiviCompletion) {
        expect(notesDeSuiviCompletion.count).toEqual(1);
      }
    });
  });
});
