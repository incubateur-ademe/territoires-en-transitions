import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { removeDemarchePcaetDocumentErrorConfig } from './remove-document.errors';
import { removeDemarchePcaetDocumentInputSchema } from './remove-document.input';
import { RemoveDemarchePcaetDocumentService } from './remove-document.service';

@Injectable()
export class RemoveDemarchePcaetDocumentRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly removeDemarchePcaetDocumentService: RemoveDemarchePcaetDocumentService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    removeDemarchePcaetDocumentErrorConfig
  );

  router = this.trpc.router({
    remove: this.trpc.authedProcedure
      .input(removeDemarchePcaetDocumentInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.removeDemarchePcaetDocumentService.removeDocument(input, {
            user: ctx.user,
          });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
