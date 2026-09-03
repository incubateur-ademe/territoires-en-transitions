import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listDocumentsAuditErrorConfig } from './list-documents-audit.errors';
import { listDocumentsAuditInputSchema } from './list-documents-audit.input';
import { listDocumentsDemandeLabellisationErrorConfig } from './list-documents-demande-labellisation.errors';
import { listDocumentsDemandeLabellisationInputSchema } from './list-documents-demande-labellisation.input';
import { ListDocumentsLabellisationService } from './list-documents-labellisation.service';

@Injectable()
export class ListDocumentsLabellisationRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDocumentsLabellisationService: ListDocumentsLabellisationService
  ) {}

  router = this.trpc.router({
    listDocumentsDemandeLabellisation: this.trpc.authedProcedure
      .input(listDocumentsDemandeLabellisationInputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const getResultDataOrThrowError = createTrpcErrorHandler(
          listDocumentsDemandeLabellisationErrorConfig
        );
        const result = await this.listDocumentsLabellisationService.listDocumentsDemandeLabellisation(
          input,
          user
        );
        return getResultDataOrThrowError(result);
      }),
    listDocumentsAudit: this.trpc.authedProcedure
      .input(listDocumentsAuditInputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const getResultDataOrThrowError = createTrpcErrorHandler(
          listDocumentsAuditErrorConfig
        );
        const result = await this.listDocumentsLabellisationService.listDocumentsAudit(
          input,
          user
        );
        return getResultDataOrThrowError(result);
      }),
  });
}
