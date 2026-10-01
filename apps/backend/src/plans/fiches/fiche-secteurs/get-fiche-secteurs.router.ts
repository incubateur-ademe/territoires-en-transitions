import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getFicheSecteursInputSchema } from './get-fiche-secteurs.input';
import { getFicheSecteursOutputSchema } from './get-fiche-secteurs.output';
import { GetFicheSecteursService } from './get-fiche-secteurs.service';

@Injectable()
export class GetFicheSecteursRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: GetFicheSecteursService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  router = this.trpc.router({
    getSecteurs: this.trpc.authedProcedure
      .input(getFicheSecteursInputSchema)
      .output(getFicheSecteursOutputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result = await this.service.getSecteurs(input, { user });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
