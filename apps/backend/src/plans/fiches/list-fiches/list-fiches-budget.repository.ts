import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { FicheWithRelations } from '@tet/domain/plans';
import { eq, inArray, sql } from 'drizzle-orm';
import { ficheActionBudgetTable } from '../fiche-action-budget/fiche-action-budget.table';
import { ficheActionTable } from '../shared/models/fiche-action.table';
import { ListFichesBelongingToPlansRepository } from './list-fiches-belonging-to-plans.repository';

@Injectable()
export class ListFichesBudgetRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly listFichesBelongingToPlansRepository: ListFichesBelongingToPlansRepository
  ) {}

  // version allégée de listFiches pour ne lire que les budgets
  // (utilisée pour calculer le budget consolidé d'un plan)
  async listFicheBudgetsBelongingToPlan({
    planId,
  }: {
    planId: number;
  }): Promise<Pick<FicheWithRelations, 'id' | 'budgets'>[]> {
    const ficheIdsRows =
      await this.listFichesBelongingToPlansRepository.listFichesBelongingToPlans(
        {
          planIds: [planId],
        }
      );

    const ficheIds = ficheIdsRows.map((row) => row.ficheId);

    const ficheBudgetsQuery = this.listFicheBudgetsByFicheId({ ficheIds });

    const query = this.databaseService.db
      .select({
        id: ficheActionTable.id,
        budgets: ficheBudgetsQuery.budgets,
      })
      .from(ficheActionTable)
      .leftJoin(
        ficheBudgetsQuery,
        eq(ficheBudgetsQuery.ficheId, ficheActionTable.id)
      )
      .where(inArray(ficheActionTable.id, ficheIds));

    return query;
  }

  listFicheBudgetsByFicheId({ ficheIds }: { ficheIds: number[] }) {
    const query = this.databaseService.db
      .select({
        ficheId: ficheActionBudgetTable.ficheId,
        budgets: sql<
          {
            id: number;
            ficheId: number;
            type: string;
            unite: string;
            annee?: number | null;
            budgetPrevisionnel?: number | null;
            budgetReel?: number | null;
            estEtale?: boolean;
          }[]
        >`array_agg
        (json_build_object(
          'id', ${ficheActionBudgetTable.id},
          'type', ${ficheActionBudgetTable.type},
          'unite', ${ficheActionBudgetTable.unite},
          'annee', ${ficheActionBudgetTable.annee},
          'budgetPrevisionnel', ${ficheActionBudgetTable.budgetPrevisionnel},
          'budgetReel', ${ficheActionBudgetTable.budgetReel},
          'estEtale', ${ficheActionBudgetTable.estEtale}))`.as('budgets'),
      })
      .from(ficheActionBudgetTable);

    query.where(inArray(ficheActionBudgetTable.ficheId, ficheIds));

    return query
      .groupBy(ficheActionBudgetTable.ficheId)
      .as('ficheActionBudgets');
  }
}
