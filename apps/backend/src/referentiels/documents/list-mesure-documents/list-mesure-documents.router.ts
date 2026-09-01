import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listMesureDocumentsErrorConfig } from './list-mesure-documents.errors';
import { listMesureDocumentsInputSchema } from './list-mesure-documents.input';
import { ListMesureDocumentsService } from './list-mesure-documents.service';

@Injectable()
export class ListMesureDocumentsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listMesureDocumentsService: ListMesureDocumentsService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listMesureDocumentsErrorConfig
  );

  router = this.trpc.router({
    listMesureDocuments: this.trpc.authedProcedure
      .input(listMesureDocumentsInputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result =
          await this.listMesureDocumentsService.listMesureDocuments(input, {
            user,
          });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
