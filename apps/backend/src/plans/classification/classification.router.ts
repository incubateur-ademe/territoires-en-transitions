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
import { enqueueMobilisationInputSchema } from './enqueue-mobilisation/enqueue-mobilisation.input';
import { EnqueueMobilisationService } from './enqueue-mobilisation/enqueue-mobilisation.service';
import { getMobilisationInputSchema } from './get-mobilisation/get-mobilisation.input';
import { mobilisationSchema } from './get-mobilisation/get-mobilisation.output';
import { GetMobilisationService } from './get-mobilisation/get-mobilisation.service';

@Injectable()
export class ClassificationRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly enqueueService: EnqueueClassificationService,
    private readonly statusService: GetClassificationStatusService,
    private readonly enqueueMobilisationService: EnqueueMobilisationService,
    private readonly mobilisationService: GetMobilisationService
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

    enqueueMobilisation: this.trpc.authedProcedure
      .input(enqueueMobilisationInputSchema)
      .output(enqueueClassificationOutputSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.enqueueMobilisationService.enqueue(input, {
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
