import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listDocumentsMesureErrorConfig } from './list-documents-mesure.errors';
import { listDocumentsMesureInputSchema } from './list-documents-mesure.input';
import { ListDocumentsMesureService } from './list-documents-mesure.service';

@Injectable()
export class ListDocumentsMesureRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDocumentsMesureService: ListDocumentsMesureService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listDocumentsMesureErrorConfig
  );

  router = this.trpc.router({
    listDocumentsMesure: this.trpc.authedProcedure
      .input(listDocumentsMesureInputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result =
          await this.listDocumentsMesureService.listDocumentsMesure(input, {
            user,
          });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
