import { Injectable } from '@nestjs/common';
import { FicheActionBudgetService } from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.service';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import {
  ficheActionBudgetSchema
} from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';
import { z } from 'zod';
import { getBudgetsRequestSchema } from '@/backend/plans/fiches/fiche-action-budget/get-budgets.request';

@Injectable()
export class FicheActionBudgetRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service : FicheActionBudgetService
  ) {}

  router = this.trpc.router({
    budgets: {
      upsert: this.trpc.authedProcedure
        .input(ficheActionBudgetSchema)
        .mutation(({ctx, input}) => {
          return this.service.upsert(input, ctx.user);
        }),
      delete: this.trpc.authedProcedure
        .input(z.object({ budgetId: z.number() }))
        .mutation(({ctx, input}) => {
          return this.service.delete(input.budgetId, ctx.user);
        }),
      list : this.trpc.authedProcedure
        .input(getBudgetsRequestSchema)
        .query(({ctx, input}) => {
          return this.service.getBudgets(input, ctx.user);
        })
    }
  });
}
