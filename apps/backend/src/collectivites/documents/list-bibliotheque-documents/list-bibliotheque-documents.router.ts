import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listBibliothequeDocumentsErrorConfig } from './list-bibliotheque-documents.errors';
import { listBibliothequeDocumentsInputSchema } from './list-bibliotheque-documents.input';
import { listBibliothequeDocumentsOutputSchema } from './list-bibliotheque-documents.output';
import { ListBibliothequeDocumentsService } from './list-bibliotheque-documents.service';

@Injectable()
export class ListBibliothequeDocumentsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ListBibliothequeDocumentsService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listBibliothequeDocumentsErrorConfig
  );

  router = this.trpc.router({
    listBibliothequeDocuments: this.trpc.authedProcedure
      .input(listBibliothequeDocumentsInputSchema)
      .output(listBibliothequeDocumentsOutputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.service.listBibliothequeDocuments(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
