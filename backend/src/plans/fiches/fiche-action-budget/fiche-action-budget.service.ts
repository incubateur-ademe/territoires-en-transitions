import { DatabaseService } from '@/backend/utils';
import {
  budgetTypeSchema,
  budgetUniteSchema,
  FicheActionBudget,
  ficheActionBudgetTable,
} from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';
import { AuthUser } from '@/backend/auth/models/auth.models';
import FicheActionPermissionsService from '@/backend/plans/fiches/fiche-action-permissions.service';
import { ficheActionTable } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { getBudgetsRequest } from '@/backend/plans/fiches/fiche-action-budget/get-budgets.request';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FicheActionBudgetService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly ficheService: FicheActionPermissionsService
  ) {}

  async upsert(
    budget: FicheActionBudget,
    user: AuthUser
  ): Promise<FicheActionBudget> {
    await this.ficheService.canWriteFiche(budget.ficheId, user);
    if (budgetTypeSchema.safeParse(budget.type).error) {
      throw new Error(
        `Le type de budget ${budget.type} n'existe pas.
        Les types possibles sont ${budgetTypeSchema.options}`
      );
    }
    if (budgetUniteSchema.safeParse(budget.unite).error) {
      throw new Error(
        `L'unité du budget en ${budget.unite} n'est pas disponible.
        Les unités possibles sont ${budgetUniteSchema.options}`
      );
    }
    return await this.databaseService.db.transaction(async (trx) => {
      // Insertion ou mise à jour du budget avec `RETURNING`
      const [result] = await trx
        .insert(ficheActionBudgetTable)
        .values({
          ...budget,
        })
        .onConflictDoUpdate({
          target: [ficheActionBudgetTable.id],
          set: {
            budgetPrevisionnel: budget.budgetPrevisionnel,
            budgetReel: budget.budgetReel,
            estEtale: budget.estEtale,
          },
        })
        .returning();

      // Met à jour la table fiche action
      await trx
        .update(ficheActionTable)
        .set({ modifiedBy: user.id, modifiedAt: new Date().toISOString() })
        .where(eq(ficheActionTable.id, budget.ficheId));

      return result;
    });
  }

  async delete(budgetId: number, user: AuthUser) {
    return this.databaseService.db.transaction(async (trx) => {
      const budgetToDelete = await trx
        .select({
          ficheId: ficheActionBudgetTable.ficheId,
        })
        .from(ficheActionBudgetTable)
        .where(eq(ficheActionBudgetTable.id, budgetId))
        .then((res) => res[0]);

      if (!budgetToDelete) {
        throw new Error('Budget not found');
      }

      await this.ficheService.canWriteFiche(budgetToDelete.ficheId, user);

      await trx
        .delete(ficheActionBudgetTable)
        .where(eq(ficheActionBudgetTable.id, budgetId));

      // Met à jour la table fiche action
      await trx
        .update(ficheActionTable)
        .set({
          modifiedBy: user?.id,
          modifiedAt: new Date().toISOString(),
        })
        .where(eq(ficheActionTable.id, budgetToDelete.ficheId));
    });
  }

  async getBudgets(
    params: getBudgetsRequest,
    user: AuthUser
  ): Promise<FicheActionBudget[]> {
    await this.ficheService.canReadFiche(params.ficheId, user);
    const query = this.databaseService.db.select().from(ficheActionBudgetTable);

    const conditions = [eq(ficheActionBudgetTable.ficheId, params.ficheId)];
    if (params.type) {
      conditions.push(eq(ficheActionBudgetTable.type, params.type));
    }

    if (params.unite) {
      conditions.push(eq(ficheActionBudgetTable.unite, params.unite));
    }

    if (params.total === true) {
      conditions.push(isNull(ficheActionBudgetTable.annee));
    } else if (params.total === false) {
      conditions.push(isNotNull(ficheActionBudgetTable.annee));
    }

    query.where(and(...conditions));

    if (params.total !== true) {
      query.orderBy(ficheActionBudgetTable.annee);
    }

    return query;
  }
}
