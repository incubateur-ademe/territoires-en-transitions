import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import z from 'zod';
import { validateAuditErrorConfig } from './validate-audit.errors';
import { ValidateAuditService } from './validate-audit.service';

@Injectable()
export class ValidateAuditRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    validateAuditErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly validateAudit: ValidateAuditService
  ) {}

  router = this.trpc.router({
    validateAudit: this.trpc.authedProcedure
      .input(z.object({ auditId: z.number() }))
      .mutation(async ({ input: { auditId }, ctx: { user } }) => {
        const result = await this.validateAudit.validateAudit({
          auditId,
          user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
