import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getFicheSecteursOutputSchema } from './get-fiche-secteurs.output';
import { upsertFicheSecteursInputSchema } from './upsert-fiche-secteurs.input';
import { UpsertFicheSecteursService } from './upsert-fiche-secteurs.service';

@Injectable()
export class UpsertFicheSecteursRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: UpsertFicheSecteursService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  router = this.trpc.router({
    upsertSecteurs: this.trpc.authedProcedure
      .input(upsertFicheSecteursInputSchema)
      .output(getFicheSecteursOutputSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.service.upsertSecteurs(input, { user });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
