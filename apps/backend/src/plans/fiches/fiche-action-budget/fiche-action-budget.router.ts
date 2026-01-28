import { Injectable } from '@nestjs/common';
import { FicheActionBudgetService } from '@tet/backend/plans/fiches/fiche-action-budget/fiche-action-budget.service';
import { getBudgetsRequestSchema } from '@tet/backend/plans/fiches/fiche-action-budget/get-budgets.request';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ficheBudgetCreateSchema } from '@tet/domain/plans';
import z from 'zod';
import { deleteBudgetsInputSchema } from './fiche-action-budget.input';

@Injectable()
export class FicheActionBudgetRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: FicheActionBudgetService
  ) {}

  router = this.trpc.router({
    budgets: {
      upsert: this.trpc.authedProcedure
        .input(z.array(ficheBudgetCreateSchema))
        .mutation(({ ctx, input }) => {
          return this.service.upsert(input, ctx.user);
        }),
      delete: this.trpc.authedProcedure
        .input(deleteBudgetsInputSchema)
        .mutation(({ ctx, input }) => {
          return this.service.delete(input.ficheId, input.budgetsIds, ctx.user);
        }),
      list: this.trpc.authedProcedure
        .input(getBudgetsRequestSchema)
        .query(({ ctx, input }) => {
          return this.service.listBudgets(input, ctx.user);
        }),
    },
  });
}
