import { Injectable } from '@nestjs/common';
import { ficheActionBudgetTable } from '@tet/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';
import { getBudgetsRequest } from '@tet/backend/plans/fiches/fiche-action-budget/get-budgets.request';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  AuthenticatedUser,
  AuthUser,
} from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { FicheBudget, FicheBudgetCreate } from '@tet/domain/plans';
import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm';

@Injectable()
export class FicheActionBudgetService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly ficheService: FicheActionPermissionsService
  ) {}

  private async findExistingBudgetById(
    id: number,
    trx: Transaction
  ): Promise<FicheBudget | undefined> {
    const [budget] = await trx
      .select()
      .from(ficheActionBudgetTable)
      .where(eq(ficheActionBudgetTable.id, id))
      .limit(1);
    return budget;
  }

  private async updateBudget(
    budget: Omit<FicheBudgetCreate, 'id'> & { id: number },
    trx: Transaction
  ): Promise<FicheBudget> {
    const [updated] = await trx
      .update(ficheActionBudgetTable)
      .set(budget)
      .where(eq(ficheActionBudgetTable.id, budget.id))
      .returning();
    return updated;
  }

  private async insertBudget(
    budget: FicheBudgetCreate,
    trx: Transaction
  ): Promise<FicheBudget> {
    try {
      const [inserted] = await trx
        .insert(ficheActionBudgetTable)
        .values({ ...budget, annee: budget.annee ?? null })
        .returning();
      return inserted;
    } catch (error) {
      console.error('Error inserting budget');
      console.error(error);
      throw error;
    }
  }

  private async upsertSingleBudget(
    budget: FicheBudgetCreate,
    trx: Transaction
  ): Promise<FicheBudget> {
    const id = budget.id;
    if (id === undefined) {
      return this.insertBudget(budget, trx);
    }
    const existingBudget = await this.findExistingBudgetById(id, trx);
    if (!existingBudget) {
      return this.insertBudget(budget, trx);
    }
    return this.updateBudget({ ...existingBudget, ...budget }, trx);
  }

  private async updateFicheModifiedAt(
    ficheId: number,
    userId: string,
    trx: Transaction
  ): Promise<void> {
    await trx
      .update(ficheActionTable)
      .set({
        modifiedBy: userId,
        modifiedAt: new Date().toISOString(),
      })
      .where(eq(ficheActionTable.id, ficheId));
  }

  async upsert(
    budgets: FicheBudgetCreate[],
    user: AuthenticatedUser
  ): Promise<FicheBudget[]> {
    if (budgets.length === 0) {
      return [];
    }

    const ficheId = budgets[0].ficheId;
    if (!budgets.every((budget) => budget.ficheId === ficheId)) {
      throw new Error('Budgets from the same call must have the same ficheId.');
    }

    await this.ficheService.canWriteFiche(ficheId, user);

    return this.databaseService.db.transaction(async (trx) => {
      console.log('budgets', budgets);
      const budgetsToReturn = await Promise.all(
        budgets.map((budget) => this.upsertSingleBudget(budget, trx))
      );

      await this.updateFicheModifiedAt(ficheId, user.id, trx);

      return budgetsToReturn;
    });
  }

  async delete(ficheId: number, budgetsIds: number[], user: AuthenticatedUser) {
    if (budgetsIds.length === 0) {
      return;
    }

    const budgets = await this.databaseService.db
      .select()
      .from(ficheActionBudgetTable)
      .where(
        and(
          eq(ficheActionBudgetTable.ficheId, ficheId),
          inArray(ficheActionBudgetTable.id, budgetsIds)
        )
      );

    if (budgets.length !== budgetsIds.length) {
      throw new Error('Some budgets were not found.');
    }

    return this.databaseService.db.transaction(async (trx) => {
      await this.ficheService.canWriteFiche(ficheId, user);

      await trx
        .delete(ficheActionBudgetTable)
        .where(inArray(ficheActionBudgetTable.id, budgetsIds));
      await this.updateFicheModifiedAt(ficheId, user.id, trx);
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
