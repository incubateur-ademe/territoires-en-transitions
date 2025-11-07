import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { CreateDocumentService } from './create-document.service';
import { createBibliothequeFichierSchema } from '../models/bibliotheque-fichier.table';

@Injectable()
export class CreateDocumentRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: CreateDocumentService
  ) {}

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(createBibliothequeFichierSchema)
      .mutation(async ({ input, ctx }) => {
        return this.service.createDocument(input, ctx.user);
      }),
  });
}
