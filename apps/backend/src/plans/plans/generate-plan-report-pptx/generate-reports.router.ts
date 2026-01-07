import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { generateReportInputSchema } from '@tet/domain/plans';
import z from 'zod';
import { generateReportErrorConfig } from './generate-reports.errors';
import { GenerateReportsService } from './generate-reports.service';
import { ReportGenerationRepository } from './report-generation.repository';

@Injectable()
export class GenerateReportsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly generateReportsService: GenerateReportsService,
    private readonly reportGenerationRepository: ReportGenerationRepository
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    generateReportErrorConfig
  );

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(generateReportInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.generateReportsService.createPendingPlanReportGeneration(
            input,
            ctx.user
          );
        return this.getResultDataOrThrowError(result);
      }),
    get: this.trpc.authedProcedure
      .input(z.object({ reportId: z.string() }))
      .query(async ({ input, ctx }) => {
        const result = await this.generateReportsService.get(
          input.reportId,
          ctx.user
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
