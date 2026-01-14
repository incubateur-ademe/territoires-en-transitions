import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { generateReportInputSchema } from '@tet/domain/plans';
import z from 'zod';
import { GenerateReportsApplicationService } from './generate-reports.application-service';
import { generateReportErrorConfig } from './generate-reports.errors';

@Injectable()
export class GenerateReportsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly generateReportsApplicationService: GenerateReportsApplicationService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    generateReportErrorConfig
  );

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(generateReportInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.generateReportsApplicationService.createPendingPlanReportGeneration(
            input,
            ctx.user
          );
        return this.getResultDataOrThrowError(result);
      }),
    get: this.trpc.authedProcedure
      .input(z.object({ reportId: z.string() }))
      .query(async ({ input, ctx }) => {
        const result = await this.generateReportsApplicationService.get(
          input.reportId,
          ctx.user
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
