import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listDocumentsInputSchema } from './list-documents.input';
import { listDocumentsOutputSchema } from './list-documents.output';
import { ListDocumentsService } from './list-documents.service';

@Injectable()
export class ListDocumentsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ListDocumentsService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listDocumentsInputSchema)
      .output(listDocumentsOutputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.service.listDocuments(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
