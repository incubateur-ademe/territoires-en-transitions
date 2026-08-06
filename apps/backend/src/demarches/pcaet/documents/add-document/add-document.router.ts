import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { addDemarchePcaetDocumentErrorConfig } from './add-document.errors';
import { addDemarchePcaetDocumentInputSchema } from './add-document.input';
import { AddDemarchePcaetDocumentService } from './add-document.service';

@Injectable()
export class AddDemarchePcaetDocumentRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly addDemarchePcaetDocumentService: AddDemarchePcaetDocumentService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    addDemarchePcaetDocumentErrorConfig
  );

  router = this.trpc.router({
    add: this.trpc.authedProcedure
      .input(addDemarchePcaetDocumentInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.addDemarchePcaetDocumentService.addDocument(
          input,
          { user: ctx.user }
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
