import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { setVulnerabiliteLigneErrorConfig } from './set-vulnerabilite-ligne.errors';
import { setVulnerabiliteLigneInputSchema } from './set-vulnerabilite-ligne.input';
import { SetVulnerabiliteLigneService } from './set-vulnerabilite-ligne.service';

@Injectable()
export class SetVulnerabiliteLigneRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly setVulnerabiliteLigneService: SetVulnerabiliteLigneService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    setVulnerabiliteLigneErrorConfig
  );

  router = this.trpc.router({
    setVulnerabiliteLigne: this.trpc.authedProcedure
      .input(setVulnerabiliteLigneInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.setVulnerabiliteLigneService.setLigne(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
