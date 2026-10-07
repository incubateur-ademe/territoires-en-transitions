import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { addVulnerabiliteThematiqueErrorConfig } from './add-vulnerabilite-thematique.errors';
import { addVulnerabiliteThematiqueInputSchema } from './add-vulnerabilite-thematique.input';
import { AddVulnerabiliteThematiqueService } from './add-vulnerabilite-thematique.service';

@Injectable()
export class AddVulnerabiliteThematiqueRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly addVulnerabiliteThematiqueService: AddVulnerabiliteThematiqueService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    addVulnerabiliteThematiqueErrorConfig
  );

  router = this.trpc.router({
    addVulnerabiliteThematique: this.trpc.authedProcedure
      .input(addVulnerabiliteThematiqueInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.addVulnerabiliteThematiqueService.addThematique(input, {
            user: ctx.user,
          });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
