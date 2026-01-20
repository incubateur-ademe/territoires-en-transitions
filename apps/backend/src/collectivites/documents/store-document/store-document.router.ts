import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { bibliothequeFichierSchemaCreate } from '@tet/domain/collectivites';
import { storeDocumentErrorConfig } from './store-document.errors';
import { StoreDocumentService } from './store-document.service';

@Injectable()
export class StoreDocumentRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: StoreDocumentService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    storeDocumentErrorConfig
  );

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(bibliothequeFichierSchemaCreate)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.storeDocument(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
