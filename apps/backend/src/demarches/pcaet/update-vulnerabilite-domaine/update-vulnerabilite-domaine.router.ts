import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { updateVulnerabiliteDomaineErrorConfig } from './update-vulnerabilite-domaine.errors';
import { updateVulnerabiliteDomaineInputSchema } from './update-vulnerabilite-domaine.input';
import { UpdateVulnerabiliteDomaineService } from './update-vulnerabilite-domaine.service';

@Injectable()
export class UpdateVulnerabiliteDomaineRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly updateVulnerabiliteDomaineService: UpdateVulnerabiliteDomaineService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    updateVulnerabiliteDomaineErrorConfig
  );

  router = this.trpc.router({
    updateVulnerabiliteDomaine: this.trpc.authedProcedure
      .input(updateVulnerabiliteDomaineInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.updateVulnerabiliteDomaineService.updateDomaine(input, {
            user: ctx.user,
          });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
