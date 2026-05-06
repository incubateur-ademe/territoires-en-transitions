import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ficheAnnexesInputSchema } from './fiche-annexes.input';
import { ficheAnnexesOutputSchema } from './fiche-annexes.output';
import { FicheAnnexesService } from './fiche-annexes.service';

@Injectable()
export class FicheAnnexesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: FicheAnnexesService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  router = this.trpc.router({
    ficheAnnexes: this.trpc.authedProcedure
      .input(ficheAnnexesInputSchema)
      .output(ficheAnnexesOutputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.service.listForFiches(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
