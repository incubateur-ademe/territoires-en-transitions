import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { classificationLeviersErrorConfig } from './classification-leviers.trpc-errors';
import { enqueueClassificationInputSchema } from './enqueue-classification/enqueue-classification.input';
import { enqueueClassificationOutputSchema } from './enqueue-classification/enqueue-classification.output';
import { EnqueueClassificationService } from './enqueue-classification/enqueue-classification.service';
import { getClassificationStatusInputSchema } from './get-classification-status/get-classification-status.input';
import { getClassificationStatusOutputSchema } from './get-classification-status/get-classification-status.output';
import { GetClassificationStatusService } from './get-classification-status/get-classification-status.service';

@Injectable()
export class PriorisationRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly enqueueService: EnqueueClassificationService,
    private readonly statusService: GetClassificationStatusService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    classificationLeviersErrorConfig
  );

  router = this.trpc.router({
    enqueueClassificationLeviers: this.trpc.authedProcedure
      .input(enqueueClassificationInputSchema)
      .output(enqueueClassificationOutputSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.enqueueService.enqueue(input, { user });
        return this.getResultDataOrThrowError(result);
      }),

    getClassificationLeviersStatus: this.trpc.authedProcedure
      .input(getClassificationStatusInputSchema)
      .output(getClassificationStatusOutputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result = await this.statusService.getStatus(input, { user });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
