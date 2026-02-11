import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import z from 'zod';
import { startAuditErrorConfig } from './start-audit.errors';
import { StartAuditService } from './start-audit.service';

@Injectable()
export class StartAuditRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly startAuditService: StartAuditService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    startAuditErrorConfig
  );
  router = this.trpc.router({
    startAudit: this.trpc.authedProcedure
      .input(z.object({ auditId: z.number() }))
      .mutation(async ({ input: { auditId }, ctx: { user } }) => {
        const result = await this.startAuditService.startAudit({
          auditId,
          user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
