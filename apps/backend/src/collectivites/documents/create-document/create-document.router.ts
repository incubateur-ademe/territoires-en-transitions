import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { bibliothequeFichierSchemaCreate } from '@tet/domain/collectivites';
import { CreateDocumentService } from './create-document.service';

@Injectable()
export class CreateDocumentRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: CreateDocumentService
  ) {}

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(bibliothequeFichierSchemaCreate)
      .mutation(async ({ input, ctx }) => {
        return this.service.createDocument(input, ctx.user);
      }),
  });
}
