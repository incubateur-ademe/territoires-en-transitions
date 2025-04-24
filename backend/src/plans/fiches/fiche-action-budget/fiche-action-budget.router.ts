import { Injectable } from '@nestjs/common';
import { FicheActionBudgetService } from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.service';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import {
  ficheActionBudgetSchema
} from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';
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
        .input(ficheActionBudgetSchema.array())
        .mutation(({ctx, input}) => {
          return this.service.upsert(input, ctx.user);
        }),
      delete: this.trpc.authedProcedure
        .input(ficheActionBudgetSchema.array())
        .mutation(({ctx, input}) => {
          return this.service.delete(input, ctx.user);
        }),
      list : this.trpc.authedProcedure
        .input(getBudgetsRequestSchema)
        .query(({ctx, input}) => {
          return this.service.getBudgets(input, ctx.user);
        })
    }
  });
}
