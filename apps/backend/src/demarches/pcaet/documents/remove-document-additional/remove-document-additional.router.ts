import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { removeDemarchePcaetDocumentAdditionalErrorConfig } from './remove-document-additional.errors';
import { removeDemarchePcaetDocumentAdditionalInputSchema } from './remove-document-additional.input';
import { RemoveDemarchePcaetDocumentAdditionalService } from './remove-document-additional.service';

@Injectable()
export class RemoveDemarchePcaetDocumentAdditionalRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly removeDemarchePcaetDocumentAdditionalService: RemoveDemarchePcaetDocumentAdditionalService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    removeDemarchePcaetDocumentAdditionalErrorConfig
  );

  router = this.trpc.router({
    removeAdditional: this.trpc.authedProcedure
      .input(removeDemarchePcaetDocumentAdditionalInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.removeDemarchePcaetDocumentAdditionalService.removeDocumentAdditional(
            input,
            { user: ctx.user }
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
