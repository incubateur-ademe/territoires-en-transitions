import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { updateDocumentErrorConfig } from './update-document.errors';
import { UpdateDocumentService } from './update-document.service';
import { updateDocumentInputSchema } from './update-document.schema';

@Injectable()
export class UpdateDocumentRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: UpdateDocumentService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    updateDocumentErrorConfig
  );

  router = this.trpc.router({
    update: this.trpc.authedProcedure
      .input(updateDocumentInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.updateDocument(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
