import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listDocumentsDemandeLabellisationErrorConfig } from './list-documents-demande-labellisation.errors';
import { listDocumentsDemandeLabellisationInputSchema } from './list-documents-demande-labellisation.input';
import { ListDocumentsDemandeLabellisationService } from './list-documents-demande-labellisation.service';

@Injectable()
export class ListDocumentsDemandeLabellisationRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDocumentsDemandeLabellisationService: ListDocumentsDemandeLabellisationService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listDocumentsDemandeLabellisationErrorConfig
  );

  router = this.trpc.router({
    listDocumentsDemandeLabellisation: this.trpc.authedProcedure
      .input(listDocumentsDemandeLabellisationInputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result =
          await this.listDocumentsDemandeLabellisationService.listDocumentsDemandeLabellisation(
            input,
            user
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
