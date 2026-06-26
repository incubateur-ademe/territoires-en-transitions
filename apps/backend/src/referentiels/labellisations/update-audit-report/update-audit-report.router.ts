import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { updateAuditReportErrorConfig } from './update-audit-report.errors';
import { updateAuditReportInputSchema } from './update-audit-report.input';
import { UpdateAuditReportService } from './update-audit-report.service';

@Injectable()
export class UpdateAuditReportRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly updateAuditReportService: UpdateAuditReportService
  ) {}

  router = this.trpc.router({
    updateAuditReport: this.trpc.authedProcedure
      .input(updateAuditReportInputSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const getResultDataOrThrowError = createTrpcErrorHandler(
          updateAuditReportErrorConfig
        );
        const result = await this.updateAuditReportService.updateAuditReport(
          input,
          user
        );
        return getResultDataOrThrowError(result);
      }),
  });
}
