import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { classificationVoletsErrorConfig } from './classification-volets.trpc-errors';
import { enqueueAnalysisInputSchema } from './enqueue-analysis/enqueue-analysis.input';
import { enqueueAnalysisOutputSchema } from './enqueue-analysis/enqueue-analysis.output';
import { EnqueueAnalysisService } from './enqueue-analysis/enqueue-analysis.service';
import { getAnalysisStatusInputSchema } from './get-analysis-status/get-analysis-status.input';
import { getAnalysisStatusOutputSchema } from './get-analysis-status/get-analysis-status.output';
import { GetAnalysisStatusService } from './get-analysis-status/get-analysis-status.service';
import { getMobilisationInputSchema } from './get-mobilisation/get-mobilisation.input';
import { mobilisationSchema } from './get-mobilisation/get-mobilisation.output';
import { GetMobilisationService } from './get-mobilisation/get-mobilisation.service';

@Injectable()
export class ClassificationRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly enqueueService: EnqueueAnalysisService,
    private readonly statusService: GetAnalysisStatusService,
    private readonly mobilisationService: GetMobilisationService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    classificationVoletsErrorConfig
  );

  router = this.trpc.router({
    enqueueAnalysis: this.trpc.authedProcedure
      .input(enqueueAnalysisInputSchema)
      .output(enqueueAnalysisOutputSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.enqueueService.enqueue(input, { user });
        return this.getResultDataOrThrowError(result);
      }),

    getAnalysisStatus: this.trpc.authedProcedure
      .input(getAnalysisStatusInputSchema)
      .output(getAnalysisStatusOutputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result = await this.statusService.getStatus(input, { user });
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
