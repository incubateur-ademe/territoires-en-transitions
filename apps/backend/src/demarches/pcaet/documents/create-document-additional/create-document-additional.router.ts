import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { createDemarchePcaetDocumentAdditionalErrorConfig } from './create-document-additional.errors';
import { createDemarchePcaetDocumentAdditionalInputSchema } from './create-document-additional.input';
import { CreateDemarchePcaetDocumentAdditionalService } from './create-document-additional.service';

@Injectable()
export class CreateDemarchePcaetDocumentAdditionalRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly createDemarchePcaetDocumentAdditionalService: CreateDemarchePcaetDocumentAdditionalService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    createDemarchePcaetDocumentAdditionalErrorConfig
  );

  router = this.trpc.router({
    createAdditional: this.trpc.authedProcedure
      .input(createDemarchePcaetDocumentAdditionalInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.createDemarchePcaetDocumentAdditionalService.createDocumentAdditional(
            input,
            { user: ctx.user }
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
