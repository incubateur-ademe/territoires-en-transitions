import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { updateVulnerabiliteThematiqueErrorConfig } from './update-vulnerabilite-thematique.errors';
import { updateVulnerabiliteThematiqueInputSchema } from './update-vulnerabilite-thematique.input';
import { UpdateVulnerabiliteThematiqueService } from './update-vulnerabilite-thematique.service';

@Injectable()
export class UpdateVulnerabiliteThematiqueRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly updateVulnerabiliteThematiqueService: UpdateVulnerabiliteThematiqueService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    updateVulnerabiliteThematiqueErrorConfig
  );

  router = this.trpc.router({
    updateVulnerabiliteThematique: this.trpc.authedProcedure
      .input(updateVulnerabiliteThematiqueInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.updateVulnerabiliteThematiqueService.updateThematique(input, {
            user: ctx.user,
          });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
