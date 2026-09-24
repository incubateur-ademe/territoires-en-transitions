import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { analysisJobErrorConfig } from './analysis-job.trpc-errors';
import { getMobilisationInputSchema } from './get-mobilisation/get-mobilisation.input';
import { mobilisationSchema } from './get-mobilisation/get-mobilisation.output';
import { GetMobilisationService } from './get-mobilisation/get-mobilisation.service';

@Injectable()
export class AnalysisRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly mobilisationService: GetMobilisationService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    analysisJobErrorConfig
  );

  router = this.trpc.router({
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
