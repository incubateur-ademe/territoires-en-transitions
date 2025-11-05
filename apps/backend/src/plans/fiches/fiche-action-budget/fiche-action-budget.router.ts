import { FicheActionBudgetService } from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.service';
import { getBudgetsRequestSchema } from '@/backend/plans/fiches/fiche-action-budget/get-budgets.request';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { ficheBudgetCreateSchema, ficheBudgetSchema } from '@/domain/plans';
import { Injectable } from '@nestjs/common';
import z from 'zod';

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
        .input(z.array(ficheBudgetSchema))
        .mutation(({ ctx, input }) => {
          return this.service.delete(input, ctx.user);
        }),
      list: this.trpc.authedProcedure
        .input(getBudgetsRequestSchema)
        .query(({ ctx, input }) => {
          return this.service.listBudgets(input, ctx.user);
        }),
    },
  });
}
