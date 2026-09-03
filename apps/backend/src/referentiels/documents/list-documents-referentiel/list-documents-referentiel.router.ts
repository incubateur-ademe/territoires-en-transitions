import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listDocumentsReferentielErrorConfig } from './list-documents-referentiel.errors';
import { listDocumentsReferentielInputSchema } from './list-documents-referentiel.input';
import { ListDocumentsReferentielService } from './list-documents-referentiel.service';

@Injectable()
export class ListDocumentsReferentielRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDocumentsReferentielService: ListDocumentsReferentielService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listDocumentsReferentielErrorConfig
  );

  router = this.trpc.router({
    listDocumentsReferentiel: this.trpc.authedProcedure
      .input(listDocumentsReferentielInputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result = await this.listDocumentsReferentielService.listDocumentsReferentiel(input, {
          user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
