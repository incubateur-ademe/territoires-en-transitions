import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { addVulnerabiliteDomaineErrorConfig } from './add-vulnerabilite-domaine.errors';
import { addVulnerabiliteDomaineInputSchema } from './add-vulnerabilite-domaine.input';
import { AddVulnerabiliteDomaineService } from './add-vulnerabilite-domaine.service';

@Injectable()
export class AddVulnerabiliteDomaineRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly addVulnerabiliteDomaineService: AddVulnerabiliteDomaineService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    addVulnerabiliteDomaineErrorConfig
  );

  router = this.trpc.router({
    addVulnerabiliteDomaine: this.trpc.authedProcedure
      .input(addVulnerabiliteDomaineInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.addVulnerabiliteDomaineService.addDomaine(
          input,
          {
            user: ctx.user,
          }
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
