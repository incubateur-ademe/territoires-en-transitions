import { ficheActionBudgetTable } from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';
import { axeTable } from '@/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionIndicateurTable } from '@/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionPiloteTable } from '@/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { ficheActionTable } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { count, eq, or, sql } from 'drizzle-orm';
import { ficheActionNoteTable } from '../../fiches/fiche-action-note/fiche-action-note.table';

type CompletionFieldName =
  | 'titre'
  | 'description'
  | 'statut'
  | 'pilotes'
  | 'objectifs'
  | 'indicateurs'
  | 'budgets'
  | 'suiviRecent';

type CompletionField = {
  name: CompletionFieldName;
  count: number;
};

// Priority order for fields to complete (from most to least priority).
// This order can be modified according to business needs.
const PRIORITY_ORDER: CompletionFieldName[] = [
  'titre',
  'description',
  'statut',
  'pilotes',
  'objectifs',
  'indicateurs',
  'budgets',
  'suiviRecent',
];

const MIN_COMPLETION_PERCENTAGE = 80;

@Injectable()
export class CompletionAnalyticsService {
  private readonly logger = new Logger(CompletionAnalyticsService.name);

  private db = this.database.db;

  constructor(private readonly database: DatabaseService) {}

  async getFieldsToComplete(planId: number) {
    this.logger.log(`Getting fields to complete for plan ${planId}`);
    return await this.shouldBeCompleted(planId);
  }

  private async shouldBeCompleted(planId: number): Promise<CompletionField[]> {
    const analytics = await this.getCompletionAnalytics(planId);
    const fieldsToComplete: CompletionField[] = [];
    Object.entries(analytics).forEach(([name, value]) => {
      if (value.percentage < MIN_COMPLETION_PERCENTAGE) {
        fieldsToComplete.push({
          name: name as CompletionFieldName,
          count: value.count,
        });
      }
    });

    return this.sortByPriority(fieldsToComplete);
  }

  private async getCompletionAnalytics(planId: number) {
    const data = await this.getCompletionData(planId);
    const total = Number(data.totalFiches);

    const calculatePercentage = (count: number) => {
      return total > 0 ? Math.round((count / total) * 100) : 0;
    };

    const analytics = {
      titre: {
        count: Number(data.titreCompleted),
        percentage: calculatePercentage(Number(data.titreCompleted)),
      },
      description: {
        count: Number(data.descriptionCompleted),
        percentage: calculatePercentage(Number(data.descriptionCompleted)),
      },
      objectifs: {
        count: Number(data.objectifsCompleted),
        percentage: calculatePercentage(Number(data.objectifsCompleted)),
      },
      pilotes: {
        count: Number(data.pilotesCompleted),
        percentage: calculatePercentage(Number(data.pilotesCompleted)),
      },
      statut: {
        count: Number(data.statutCompleted),
        percentage: calculatePercentage(Number(data.statutCompleted)),
      },
      indicateurs: {
        count: Number(data.indicateursCompleted),
        percentage: calculatePercentage(Number(data.indicateursCompleted)),
      },
      budgets: {
        count: Number(data.budgetsCompleted),
        percentage: calculatePercentage(Number(data.budgetsCompleted)),
      },
      suiviRecent: {
        count: Number(data.suiviRecent),
        percentage: calculatePercentage(Number(data.suiviRecent)),
      },
    };

    return analytics;
  }

  private async getCompletionData(planId: number) {
    const fichesInPlan = this.db
      .select({ ficheId: ficheActionAxeTable.ficheId })
      .from(ficheActionAxeTable)
      .innerJoin(axeTable, eq(axeTable.id, ficheActionAxeTable.axeId))
      .where(or(eq(axeTable.id, planId), eq(axeTable.plan, planId)))
      .as('fiches_in_plan');

    // Date limit for "modified recently" notes de suivi (less than one year ago)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const result = await this.db
      .select({
        totalFiches: count(ficheActionTable.id).as('total_fiches'),

        titreCompleted: sql<number>`COUNT(CASE
          WHEN ${ficheActionTable.titre} IS NOT NULL
          AND ${ficheActionTable.titre} != ''
          AND ${ficheActionTable.titre} != 'Sans titre'
          THEN 1 END)`.as('titre_completed'),

        descriptionCompleted: sql<number>`COUNT(CASE
          WHEN ${ficheActionTable.description} IS NOT NULL
          AND ${ficheActionTable.description} != ''
          THEN 1 END)`.as('description_completed'),

        statutCompleted: sql<number>`COUNT(CASE
          WHEN ${ficheActionTable.statut} IS NOT NULL
          THEN 1 END)`.as('statut_completed'),

        pilotesCompleted: sql<number>`COUNT(CASE
          WHEN EXISTS (
            SELECT 1 FROM ${ficheActionPiloteTable}
            WHERE ${ficheActionPiloteTable.ficheId} = ${ficheActionTable.id}
          ) THEN 1 END)`.as('pilotes_completed'),

        objectifsCompleted: sql<number>`COUNT(CASE
          WHEN ${ficheActionTable.objectifs} IS NOT NULL
          AND ${ficheActionTable.objectifs} != ''
          THEN 1 END)`.as('objectifs_completed'),

        indicateursCompleted: sql<number>`COUNT(CASE
          WHEN EXISTS (
            SELECT 1 FROM ${ficheActionIndicateurTable}
            WHERE ${ficheActionIndicateurTable.ficheId} = ${ficheActionTable.id}
          ) THEN 1 END)`.as('indicateurs_completed'),

        budgetsCompleted: sql<number>`COUNT(CASE
          WHEN EXISTS (
            SELECT 1 FROM ${ficheActionBudgetTable}
            WHERE ${ficheActionBudgetTable.ficheId} = ${ficheActionTable.id}
          ) THEN 1 END)`.as('budget_completed'),

        suiviRecent: sql<number>`COUNT(CASE
          WHEN
          EXISTS (
            SELECT 1 FROM ${ficheActionNoteTable}
            WHERE ${ficheActionNoteTable.ficheId} = ${ficheActionTable.id}
            AND ${
              ficheActionNoteTable.modifiedAt
            } >= ${oneYearAgo.toISOString()}
          )
          THEN 1 END)`.as('suivi_recent'),
      })
      .from(ficheActionTable)
      .innerJoin(fichesInPlan, eq(ficheActionTable.id, fichesInPlan.ficheId));

    return result[0];
  }

  private sortByPriority(items: CompletionField[]): CompletionField[] {
    return items.sort((a, b) => {
      const indexA = PRIORITY_ORDER.indexOf(a.name);
      const indexB = PRIORITY_ORDER.indexOf(b.name);

      if (this.isOutsidePriorityOrder(indexA)) return 1;
      if (this.isOutsidePriorityOrder(indexB)) return -1;

      return indexA - indexB;
    });
  }

  private isOutsidePriorityOrder(index: number): boolean {
    return index === -1;
  }
}
