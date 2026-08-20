import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { updateDemarchePcaetDocumentAdditionalErrorConfig } from './update-document-additional.errors';
import { updateDemarchePcaetDocumentAdditionalInputSchema } from './update-document-additional.input';
import { UpdateDemarchePcaetDocumentAdditionalService } from './update-document-additional.service';

@Injectable()
export class UpdateDemarchePcaetDocumentAdditionalRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly updateDemarchePcaetDocumentAdditionalService: UpdateDemarchePcaetDocumentAdditionalService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    updateDemarchePcaetDocumentAdditionalErrorConfig
  );

  router = this.trpc.router({
    updateAdditional: this.trpc.authedProcedure
      .input(updateDemarchePcaetDocumentAdditionalInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.updateDemarchePcaetDocumentAdditionalService.updateDocumentAdditional(
            input,
            { user: ctx.user }
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
