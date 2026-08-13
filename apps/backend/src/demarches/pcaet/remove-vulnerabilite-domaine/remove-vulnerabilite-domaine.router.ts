import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { removeVulnerabiliteDomaineErrorConfig } from './remove-vulnerabilite-domaine.errors';
import { removeVulnerabiliteDomaineInputSchema } from './remove-vulnerabilite-domaine.input';
import { RemoveVulnerabiliteDomaineService } from './remove-vulnerabilite-domaine.service';

@Injectable()
export class RemoveVulnerabiliteDomaineRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly removeVulnerabiliteDomaineService: RemoveVulnerabiliteDomaineService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    removeVulnerabiliteDomaineErrorConfig
  );

  router = this.trpc.router({
    removeVulnerabiliteDomaine: this.trpc.authedProcedure
      .input(removeVulnerabiliteDomaineInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.removeVulnerabiliteDomaineService.removeDomaine(input, {
            user: ctx.user,
          });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
