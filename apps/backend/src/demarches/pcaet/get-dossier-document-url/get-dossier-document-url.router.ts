import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getDossierDocumentUrlErrorConfig } from './get-dossier-document-url.errors';
import { getDossierDocumentUrlInputSchema } from './get-dossier-document-url.input';
import { GetDossierDocumentUrlService } from './get-dossier-document-url.service';

@Injectable()
export class GetDossierDocumentUrlRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getDossierDocumentUrlService: GetDossierDocumentUrlService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    getDossierDocumentUrlErrorConfig
  );

  router = this.trpc.router({
    getDossierDocumentUrl: this.trpc.authedProcedure
      .input(getDossierDocumentUrlInputSchema)
      .query(async ({ input, ctx }) => {
        const result =
          await this.getDossierDocumentUrlService.getDossierDocumentUrl(
            input,
            { user: ctx.user }
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
