import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listDemarchePcaetDocumentsErrorConfig } from './list-documents.errors';
import { listDemarchePcaetDocumentsInputSchema } from './list-documents.input';
import { ListDemarchePcaetDocumentsService } from './list-documents.service';

@Injectable()
export class ListDemarchePcaetDocumentsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDemarchePcaetDocumentsService: ListDemarchePcaetDocumentsService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listDemarchePcaetDocumentsErrorConfig
  );

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listDemarchePcaetDocumentsInputSchema)
      .query(async ({ input, ctx }) => {
        const result =
          await this.listDemarchePcaetDocumentsService.listDocuments(input, {
            user: ctx.user,
          });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
