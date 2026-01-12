import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { bibliothequeFichierSchemaCreate } from '@tet/domain/collectivites';
import { createDocumentErrorConfig } from './create-document.errors';
import { CreateDocumentService } from './create-document.service';

@Injectable()
export class CreateDocumentRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: CreateDocumentService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    createDocumentErrorConfig
  );

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(bibliothequeFichierSchemaCreate)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.createDocument(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
