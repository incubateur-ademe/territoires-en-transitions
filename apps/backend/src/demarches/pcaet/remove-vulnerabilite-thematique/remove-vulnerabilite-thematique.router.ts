import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { removeVulnerabiliteThematiqueErrorConfig } from './remove-vulnerabilite-thematique.errors';
import { removeVulnerabiliteThematiqueInputSchema } from './remove-vulnerabilite-thematique.input';
import { RemoveVulnerabiliteThematiqueService } from './remove-vulnerabilite-thematique.service';

@Injectable()
export class RemoveVulnerabiliteThematiqueRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly removeVulnerabiliteThematiqueService: RemoveVulnerabiliteThematiqueService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    removeVulnerabiliteThematiqueErrorConfig
  );

  router = this.trpc.router({
    removeVulnerabiliteThematique: this.trpc.authedProcedure
      .input(removeVulnerabiliteThematiqueInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.removeVulnerabiliteThematiqueService.removeThematique(
            input,
            {
              user: ctx.user,
            }
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
