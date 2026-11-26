import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  FicheActionBudgetError,
  FicheActionBudgetErrorEnum,
} from '@tet/backend/plans/fiches/fiche-action-budget/fiche-action-budget.errors';
import {
  assertNoDuplicateBudgets,
  FicheBudget,
  FicheBudgetCreate,
} from '@tet/domain/plans';
import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm';

type UpsertBudgetTransactionFailure = {
  reason: 'UPSERT_BUDGET_TRANSACTION_FAILURE';
  result: Result<never, FicheActionBudgetError>;
};

const isUpsertBudgetTransactionFailure = (
  error: unknown
): error is UpsertBudgetTransactionFailure =>
  typeof error === 'object' &&
  error !== null &&
  (error as UpsertBudgetTransactionFailure).reason ===
    'UPSERT_BUDGET_TRANSACTION_FAILURE';

@Injectable()
export class FicheActionBudgetService {
  private readonly logger = new Logger(FicheActionBudgetService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly ficheService: FicheActionPermissionsService
  ) {}

  private async findExistingBudgetById(
    id: number,
    ficheId: number,
    trx: Transaction
  ): Promise<FicheBudget | undefined> {
    const [budget] = await trx
      .select()
      .from(ficheActionBudgetTable)
      .where(
        and(
          eq(ficheActionBudgetTable.id, id),
          eq(ficheActionBudgetTable.ficheId, ficheId)
        )
      )
      .limit(1);
    return budget;
  }

  private async updateBudget(
    budget: Omit<FicheBudgetCreate, 'id' | 'ficheId'> & {
      id: number;
      ficheId: number;
    },
    trx: Transaction
  ): Promise<FicheBudget> {
    const { ficheId, ...updatable } = budget;
    const [updated] = await trx
      .update(ficheActionBudgetTable)
      .set(updatable)
      .where(
        and(
          eq(ficheActionBudgetTable.id, budget.id),
          eq(ficheActionBudgetTable.ficheId, ficheId)
        )
      )
      .returning();
    return updated;
  }

  private async insertBudget(
    budget: FicheBudgetCreate,
    trx: Transaction
  ): Promise<FicheBudget> {
    const [inserted] = await trx
      .insert(ficheActionBudgetTable)
      .values({ ...budget, annee: budget.annee ?? null })
      .returning();
    return inserted;
  }

  private async upsertSingleBudget(
    budget: FicheBudgetCreate,
    trx: Transaction
  ): Promise<Result<FicheBudget, FicheActionBudgetError>> {
    const id = budget.id;
    if (id === undefined) {
      return success(await this.insertBudget(budget, trx));
    }
    const existingBudget = await this.findExistingBudgetById(
      id,
      budget.ficheId,
      trx
    );
    if (!existingBudget) {
      return failure(
        FicheActionBudgetErrorEnum.BUDGET_NOT_FOUND,
        new Error(`Budget ${id} not found on fiche ${budget.ficheId}.`)
      );
    }
    return success(
      await this.updateBudget(
        { ...existingBudget, ...budget, id, ficheId: existingBudget.ficheId },
        trx
      )
    );
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
    { user }: ServiceSecondArg
  ): Promise<Result<FicheBudget[], FicheActionBudgetError>> {
    if (budgets.length === 0) {
      return success([]);
    }

    const ficheId = budgets[0].ficheId;
    if (!budgets.every((budget) => budget.ficheId === ficheId)) {
      return failure(FicheActionBudgetErrorEnum.INVALID_FICHE_ID);
    }

    try {
      assertNoDuplicateBudgets(budgets);
    } catch (error) {
      return failure(
        FicheActionBudgetErrorEnum.DUPLICATE_BUDGET,
        error instanceof Error ? error : new Error(String(error))
      );
    }

    const permissionResult = await this.checkCanWriteFiche(ficheId, user);
    if (!permissionResult.success) return permissionResult;

    try {
      return await this.databaseService.db.transaction(async (trx) => {
        const budgetsToReturn: FicheBudget[] = [];
        for (const budget of budgets) {
          const result = await this.upsertSingleBudget(budget, trx);
          if (!result.success) {
            throw {
              reason: 'UPSERT_BUDGET_TRANSACTION_FAILURE',
              result,
            } satisfies UpsertBudgetTransactionFailure;
          }
          budgetsToReturn.push(result.data);
        }

        await this.updateFicheModifiedAt(ficheId, user.id, trx);
        return success(budgetsToReturn);
      });
    } catch (error) {
      if (isUpsertBudgetTransactionFailure(error)) {
        return error.result;
      }
      this.logger.error(
        `Échec de l'upsert des budgets de la fiche ${ficheId}`,
        error
      );
      return failure(
        FicheActionBudgetErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async insertBudgets(
    budgets: FicheBudgetCreate[],
    tx: Transaction
  ): Promise<Result<undefined, 'SERVER_ERROR'>> {
    try {
      for (const budget of budgets) {
        await this.insertBudget(budget, tx);
      }
      return success(undefined);
    } catch (error) {
      this.logger.error('Échec de l’insertion des budgets', error);
      return failure(
        'SERVER_ERROR',
        error instanceof Error ? error : undefined
      );
    }
  }

  private async checkCanWriteFiche(
    ficheId: number,
    user: AuthenticatedUser
  ): Promise<Result<undefined, FicheActionBudgetError>> {
    try {
      await this.ficheService.canWriteFiche(ficheId, user);
      return success(undefined);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return failure(FicheActionBudgetErrorEnum.FICHE_NOT_FOUND, error);
      }
      if (error instanceof ForbiddenException) {
        return failure(FicheActionBudgetErrorEnum.UNAUTHORIZED, error);
      }
      this.logger.error(
        `Échec du contrôle d’écriture sur la fiche ${ficheId}`,
        error
      );
      return failure(
        FicheActionBudgetErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private async checkCanReadFiche(
    ficheId: number,
    user: AuthUser
  ): Promise<Result<undefined, FicheActionBudgetError>> {
    try {
      await this.ficheService.canReadFiche(ficheId, user);
      return success(undefined);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return failure(FicheActionBudgetErrorEnum.FICHE_NOT_FOUND, error);
      }
      if (error instanceof ForbiddenException) {
        return failure(FicheActionBudgetErrorEnum.UNAUTHORIZED, error);
      }
      this.logger.error(
        `Échec du contrôle de lecture sur la fiche ${ficheId}`,
        error
      );
      return failure(
        FicheActionBudgetErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async delete(
    ficheId: number,
    budgetsIds: number[],
    { user }: ServiceSecondArg
  ): Promise<Result<undefined, FicheActionBudgetError>> {
    if (budgetsIds.length === 0) {
      return success(undefined);
    }

    const permissionResult = await this.checkCanWriteFiche(ficheId, user);
    if (!permissionResult.success) return permissionResult;

    try {
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
        return failure(FicheActionBudgetErrorEnum.BUDGET_NOT_FOUND);
      }

      return await this.databaseService.db.transaction(async (trx) => {
        await trx
          .delete(ficheActionBudgetTable)
          .where(
            and(
              eq(ficheActionBudgetTable.ficheId, ficheId),
              inArray(ficheActionBudgetTable.id, budgetsIds)
            )
          );
        await this.updateFicheModifiedAt(ficheId, user.id, trx);
        return success(undefined);
      });
    } catch (error) {
      this.logger.error(
        `Échec de la suppression des budgets de la fiche ${ficheId}`,
        error
      );
      return failure(
        FicheActionBudgetErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async listBudgets(
    params: getBudgetsRequest,
    user: AuthUser
  ): Promise<Result<FicheBudget[], FicheActionBudgetError>> {
    const permissionResult = await this.checkCanReadFiche(params.ficheId, user);
    if (!permissionResult.success) return permissionResult;

    try {
      const query = this.databaseService.db
        .select()
        .from(ficheActionBudgetTable);

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

      return success(await query);
    } catch (error) {
      this.logger.error(
        `Échec de la lecture des budgets de la fiche ${params.ficheId}`,
        error
      );
      return failure(
        FicheActionBudgetErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
