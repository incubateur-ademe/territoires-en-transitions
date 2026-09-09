import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import {
  DEFAULT_FORMULA_RECONCILIATION_DRAIN_LIMIT,
  IndicateurFormulaReconciliationService,
  MAX_FORMULA_RECONCILIATION_DRAIN_LIMIT,
} from './indicateur-formula-reconciliation.service';

const drainFormulaReconciliationsInput = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_FORMULA_RECONCILIATION_DRAIN_LIMIT)
    .default(DEFAULT_FORMULA_RECONCILIATION_DRAIN_LIMIT),
});

@Injectable()
export class IndicateurFormulaReconciliationRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: IndicateurFormulaReconciliationService
  ) {}

  router = this.trpc.router({
    drain: this.trpc.serviceRoleProcedure
      .input(drainFormulaReconciliationsInput)
      .mutation(({ input }) => this.service.drain({ limit: input.limit })),
  });
}
