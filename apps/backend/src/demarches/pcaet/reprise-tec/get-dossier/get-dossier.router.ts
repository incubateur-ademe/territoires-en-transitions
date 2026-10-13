import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getDossierErrorConfig } from './get-dossier.errors';
import { getDossierInputSchema } from './get-dossier.input';
import { GetDossierService } from './get-dossier.service';

@Injectable()
export class GetDossierRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getDossierService: GetDossierService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    getDossierErrorConfig
  );

  router = this.trpc.router({
    getDossier: this.trpc.authedProcedure
      .input(getDossierInputSchema)
      .query(async ({ input, ctx }) =>
        this.getResultDataOrThrowError(
          await this.getDossierService.getDossier(input, {
            user: ctx.user,
          })
        )
      ),
  });
}
