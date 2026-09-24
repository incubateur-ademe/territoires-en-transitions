import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { analysisJobErrorConfig } from './analysis-job.trpc-errors';
import { enqueueAnalysisInputSchema } from './enqueue-analysis/enqueue-analysis.input';
import { enqueueAnalysisOutputSchema } from './enqueue-analysis/enqueue-analysis.output';
import { EnqueueAnalysisService } from './enqueue-analysis/enqueue-analysis.service';
import { getLastAnalysisInputSchema } from './get-last-analysis/get-last-analysis.input';
import { getLastAnalysisOutputSchema } from './get-last-analysis/get-last-analysis.output';
import { GetLastAnalysisService } from './get-last-analysis/get-last-analysis.service';
import { getMobilisationInputSchema } from './get-mobilisation/get-mobilisation.input';
import { mobilisationSchema } from './get-mobilisation/get-mobilisation.output';
import { GetMobilisationService } from './get-mobilisation/get-mobilisation.service';

@Injectable()
export class AnalysisRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly enqueueService: EnqueueAnalysisService,
    private readonly lastAnalysisService: GetLastAnalysisService,
    private readonly mobilisationService: GetMobilisationService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    analysisJobErrorConfig
  );

  router = this.trpc.router({
    enqueueAnalysis: this.trpc.authedProcedure
      .input(enqueueAnalysisInputSchema)
      .output(enqueueAnalysisOutputSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.enqueueService.enqueue(input, { user });
        return this.getResultDataOrThrowError(result);
      }),

    getLastAnalysis: this.trpc.authedProcedure
      .input(getLastAnalysisInputSchema)
      .output(getLastAnalysisOutputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result = await this.lastAnalysisService.getLastAnalysis(input, {
          user,
        });
        return this.getResultDataOrThrowError(result);
      }),

    getMobilisation: this.trpc.authedProcedure
      .input(getMobilisationInputSchema)
      .output(mobilisationSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result = await this.mobilisationService.getMobilisation(input, {
          user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
