import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listDocumentsErrorConfig } from './list-documents.errors';
import { listDocumentsInputSchema } from './list-documents.input';
import { ListDocumentsService } from './list-documents.service';

@Injectable()
export class ListDocumentsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDocumentsService: ListDocumentsService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listDocumentsErrorConfig
  );

  router = this.trpc.router({
    listDocuments: this.trpc.authedProcedure
      .input(listDocumentsInputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result = await this.listDocumentsService.listDocuments(input, {
          user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
