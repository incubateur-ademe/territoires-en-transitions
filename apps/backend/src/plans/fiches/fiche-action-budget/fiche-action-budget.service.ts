import { Injectable } from '@nestjs/common';
import { ficheActionBudgetTable } from '@tet/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';
import { getBudgetsRequest } from '@tet/backend/plans/fiches/fiche-action-budget/get-budgets.request';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { FicheBudget, FicheBudgetCreate } from '@tet/domain/plans';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';

@Injectable()
export class FicheActionBudgetService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly ficheService: FicheActionPermissionsService
  ) {}

  async upsert(
    budgets: FicheBudgetCreate[],
    user: AuthUser
  ): Promise<FicheBudget[]> {
    // Check que les budgets ont la même fiche action
    if (budgets.length === 0) {
      return [];
    }
    const ficheId = budgets[0].ficheId;
    if (!budgets.every((budget) => budget.ficheId === ficheId)) {
      throw new Error('Budgets from the same call must have the same ficheId.');
    }

    await this.ficheService.canWriteFiche(ficheId, user);

    return await this.databaseService.db.transaction(async (trx) => {
      const budgetsToReturn: FicheBudget[] = [];

      for (const budget of budgets) {
        // Insertion ou mise à jour du budget avec `RETURNING`
        const [result] = await trx
          .insert(ficheActionBudgetTable)
          .values(budget)
          .onConflictDoUpdate({
            target: [ficheActionBudgetTable.id],
            set: {
              budgetPrevisionnel: budget.budgetPrevisionnel,
              budgetReel: budget.budgetReel,
              estEtale: budget.estEtale,
            },
          })
          .returning();

        budgetsToReturn.push(result);
      }

      // Met à jour la table fiche action
      await trx
        .update(ficheActionTable)
        .set({ modifiedBy: user.id, modifiedAt: new Date().toISOString() })
        .where(eq(ficheActionTable.id, ficheId));

      return budgetsToReturn;
    });
  }

  async delete(budgets: FicheBudget[], user: AuthUser) {
    // Check que les budgets ont la même fiche action
    if (budgets.length === 0) {
      return;
    }
    const ficheId = budgets[0].ficheId;
    if (!budgets.every((budget) => budget.ficheId === ficheId)) {
      throw new Error('Budgets from the same call must have the same ficheId.');
    }

    return this.databaseService.db.transaction(async (trx) => {
      await this.ficheService.canWriteFiche(ficheId, user);
      for (const budget of budgets) {
        if (budget.id) {
          await trx
            .delete(ficheActionBudgetTable)
            .where(eq(ficheActionBudgetTable.id, budget.id));
        } else {
          throw new Error('A given budget has no identifier');
        }
      }

      // Met à jour la table fiche action
      await trx
        .update(ficheActionTable)
        .set({
          modifiedBy: user?.id,
          modifiedAt: new Date().toISOString(),
        })
        .where(eq(ficheActionTable.id, ficheId));
    });
  }

  async listBudgets(
    params: getBudgetsRequest,
    user: AuthUser
  ): Promise<FicheBudget[]> {
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

    const result = await query;
    return result;
  }
}
