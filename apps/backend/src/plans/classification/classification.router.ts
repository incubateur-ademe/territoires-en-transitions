import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { classificationVoletsErrorConfig } from './classification-volets.trpc-errors';
import { enqueueClassificationInputSchema } from './enqueue-classification/enqueue-classification.input';
import { enqueueClassificationOutputSchema } from './enqueue-classification/enqueue-classification.output';
import { EnqueueClassificationService } from './enqueue-classification/enqueue-classification.service';
import { getClassificationStatusInputSchema } from './get-classification-status/get-classification-status.input';
import { getClassificationStatusOutputSchema } from './get-classification-status/get-classification-status.output';
import { GetClassificationStatusService } from './get-classification-status/get-classification-status.service';

@Injectable()
export class ClassificationRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly enqueueService: EnqueueClassificationService,
    private readonly statusService: GetClassificationStatusService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    classificationVoletsErrorConfig
  );

  router = this.trpc.router({
    enqueueClassification: this.trpc.authedProcedure
      .input(enqueueClassificationInputSchema)
      .output(enqueueClassificationOutputSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.enqueueService.enqueue(input, { user });
        return this.getResultDataOrThrowError(result);
      }),

    getClassificationStatus: this.trpc.authedProcedure
      .input(getClassificationStatusInputSchema)
      .output(getClassificationStatusOutputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result = await this.statusService.getStatus(input, { user });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
