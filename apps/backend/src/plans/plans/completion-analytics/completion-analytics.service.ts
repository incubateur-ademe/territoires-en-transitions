import { ficheActionBudgetTable } from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';
import { axeTable } from '@/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionIndicateurTable } from '@/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionPiloteTable } from '@/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { ficheActionTable } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { count, eq, or, sql } from 'drizzle-orm';

@Injectable()
export class CompletionAnalyticsService {
  private readonly logger = new Logger(CompletionAnalyticsService.name);

  private db = this.database.db;

  constructor(private readonly database: DatabaseService) {}

  async get(planId: number) {
    // Sous-requête pour récupérer toutes les fiches du plan (y compris des sous-axes)
    const fichesInPlan = this.db
      .select({ ficheId: ficheActionAxeTable.ficheId })
      .from(ficheActionAxeTable)
      .innerJoin(axeTable, eq(axeTable.id, ficheActionAxeTable.axeId))
      .where(
        or(
          eq(axeTable.id, planId), // L'axe est le plan lui-même
          eq(axeTable.plan, planId) // L'axe appartient au plan
        )
      )
      .as('fiches_in_plan');

    // Date limite pour "modifié il y a moins d'un an"
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

        // Indicateurs remplis (au moins un indicateur)
        indicateursCompleted: sql<number>`COUNT(CASE
          WHEN EXISTS (
            SELECT 1 FROM ${ficheActionIndicateurTable}
            WHERE ${ficheActionIndicateurTable.ficheId} = ${ficheActionTable.id}
          ) THEN 1 END)`.as('indicateurs_completed'),

        // Budget rempli (au moins une ligne de budget)
        budgetCompleted: sql<number>`COUNT(CASE
          WHEN EXISTS (
            SELECT 1 FROM ${ficheActionBudgetTable}
            WHERE ${ficheActionBudgetTable.ficheId} = ${ficheActionTable.id}
          ) THEN 1 END)`.as('budget_completed'),

        // Modifié il y a moins d'un an
        modifiedRecently: sql<number>`COUNT(CASE
          WHEN ${ficheActionTable.modifiedAt} >= ${oneYearAgo.toISOString()}
          THEN 1 END)`.as('modified_recently'),
      })
      .from(ficheActionTable)
      .innerJoin(fichesInPlan, eq(ficheActionTable.id, fichesInPlan.ficheId));

    const data = result[0];
    const total = Number(data.totalFiches);

    // Calculer les pourcentages
    const calculatePercentage = (count: number) => {
      return total > 0 ? Math.round((count / total) * 100) : 0;
    };

    return {
      totalFiches: total,
      titreRempli: {
        count: Number(data.titreCompleted),
        percentage: calculatePercentage(Number(data.titreCompleted)),
      },
      descriptionRemplie: {
        count: Number(data.descriptionCompleted),
        percentage: calculatePercentage(Number(data.descriptionCompleted)),
      },
      statutCompleted: {
        count: Number(data.statutCompleted),
        percentage: calculatePercentage(Number(data.statutCompleted)),
      },
      pilotesCompleted: {
        count: Number(data.pilotesCompleted),
        percentage: calculatePercentage(Number(data.pilotesCompleted)),
      },
      indicateursCompleted: {
        count: Number(data.indicateursCompleted),
        percentage: calculatePercentage(Number(data.indicateursCompleted)),
      },
      budgetCompleted: {
        count: Number(data.budgetCompleted),
        percentage: calculatePercentage(Number(data.budgetCompleted)),
      },
      modifiedRecently: {
        count: Number(data.modifiedRecently),
        percentage: calculatePercentage(Number(data.modifiedRecently)),
      },
    };
  }
}
