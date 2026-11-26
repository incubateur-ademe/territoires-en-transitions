import { Injectable } from '@nestjs/common';
import { FicheActionBudgetService } from '@tet/backend/plans/fiches/fiche-action-budget/fiche-action-budget.service';
import { getBudgetsRequestSchema } from '@tet/backend/plans/fiches/fiche-action-budget/get-budgets.request';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ficheBudgetCreateSchema } from '@tet/domain/plans';
import z from 'zod';
import { deleteBudgetsInputSchema } from './fiche-action-budget.input';
import { ficheActionBudgetErrorConfig } from './fiche-action-budget.errors';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';

@Injectable()
export class FicheActionBudgetRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    ficheActionBudgetErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly service: FicheActionBudgetService
  ) {}

  router = this.trpc.router({
    budgets: {
      upsert: this.trpc.authedProcedure
        .input(z.array(ficheBudgetCreateSchema))
        .mutation(async ({ ctx: { user }, input }) => {
          const result = await this.service.upsert(input, { user });
          return this.getResultDataOrThrowError(result);
        }),
      delete: this.trpc.authedProcedure
        .input(deleteBudgetsInputSchema)
        .mutation(async ({ ctx: { user }, input }) => {
          const result = await this.service.delete(
            input.ficheId,
            input.budgetsIds,
            { user }
          );
          return this.getResultDataOrThrowError(result);
        }),
      list: this.trpc.authedProcedure
        .input(getBudgetsRequestSchema)
        .query(async ({ ctx: { user }, input }) => {
          const result = await this.service.listBudgets(input, user);
          return this.getResultDataOrThrowError(result);
        }),
    },
  });
}
