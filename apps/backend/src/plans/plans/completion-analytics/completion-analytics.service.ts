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
import { CompletionField } from './completion-analytics.dto';
import { getCompletion } from './domain/plan.completion-calculator';

@Injectable()
export class CompletionAnalyticsService {
  private readonly logger = new Logger(CompletionAnalyticsService.name);

  private db = this.database.db;

  constructor(private readonly database: DatabaseService) {}

  async getFieldsToComplete(planId: number) {
    this.logger.log(`Getting fields to complete for plan ${planId}`);
    return await this.getFieldsNeedingCompletion(planId);
  }

  private async getFieldsNeedingCompletion(
    planId: number
  ): Promise<CompletionField[]> {
    const data = await this.getCompletionData(planId);

    if (data.totalFiches === 0) {
      return [];
    }

    return getCompletion(data, data.totalFiches);
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

    // In october 2025, product team defined these fields as the most important to complete for a plan.
    const result = await this.db
      .select({
        totalFiches: count(ficheActionTable.id).as('total_fiches'),

        titre: {
          completed: sql<number>`COUNT(CASE
            WHEN ${ficheActionTable.titre} IS NOT NULL
            AND ${ficheActionTable.titre} != ''
            AND ${ficheActionTable.titre} != 'Sans titre'
            THEN 1 END)`.as('titre_completed'),
        },

        description: {
          completed: sql<number>`COUNT(CASE
          WHEN ${ficheActionTable.description} IS NOT NULL
          AND ${ficheActionTable.description} != ''
          THEN 1 END)`.as('description_completed'),
        },

        statut: {
          completed: sql<number>`COUNT(CASE
          WHEN ${ficheActionTable.statut} IS NOT NULL
          THEN 1 END)`.as('statut_completed'),
        },

        pilotes: {
          completed: sql<number>`COUNT(CASE
          WHEN EXISTS (
            SELECT 1 FROM ${ficheActionPiloteTable}
            WHERE ${ficheActionPiloteTable.ficheId} = ${ficheActionTable.id}
          ) THEN 1 END)`.as('pilotes_completed'),
        },

        objectifs: {
          completed: sql<number>`COUNT(CASE
          WHEN ${ficheActionTable.objectifs} IS NOT NULL
          AND ${ficheActionTable.objectifs} != ''
          THEN 1 END)`.as('objectifs_completed'),
        },

        indicateurs: {
          completed: sql<number>`COUNT(CASE
          WHEN EXISTS (
            SELECT 1 FROM ${ficheActionIndicateurTable}
            WHERE ${ficheActionIndicateurTable.ficheId} = ${ficheActionTable.id}
          ) THEN 1 END)`.as('indicateurs_completed'),
        },

        budgets: {
          completed: sql<number>`COUNT(CASE
          WHEN EXISTS (
            SELECT 1 FROM ${ficheActionBudgetTable}
            WHERE ${ficheActionBudgetTable.ficheId} = ${ficheActionTable.id}
          ) THEN 1 END)`.as('budget_completed'),
        },

        suiviRecent: {
          completed: sql<number>`COUNT(CASE
          WHEN
          EXISTS (
            SELECT 1 FROM ${ficheActionNoteTable}
            WHERE ${ficheActionNoteTable.ficheId} = ${ficheActionTable.id}
            AND ${
              ficheActionNoteTable.modifiedAt
            } >= ${oneYearAgo.toISOString()}
          )
          THEN 1 END)`.as('suivi_recent'),
        },
      })
      .from(ficheActionTable)
      .innerJoin(fichesInPlan, eq(ficheActionTable.id, fichesInPlan.ficheId));

    return result[0];
  }
}
