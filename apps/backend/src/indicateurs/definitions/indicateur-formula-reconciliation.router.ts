import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import { indicateurFormulaReconciliationErrorConfig } from './indicateur-formula-reconciliation.errors';
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

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    indicateurFormulaReconciliationErrorConfig
  );

  router = this.trpc.router({
    drain: this.trpc.serviceRoleProcedure
      .input(drainFormulaReconciliationsInput)
      .mutation(async ({ input }) => {
        const result = await this.service.drain({ limit: input.limit });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
