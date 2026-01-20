import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { createLabellisationPreuveErrorConfig } from '../create-preuve/create-labellisation-preuve.errors';
import { listePreuvesLabellisationInputSchema } from './liste-preuves.input';
import { ListePreuvesService } from './liste-preuves.service';

@Injectable()
export class ListePreuvesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listePreuvesService: ListePreuvesService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    createLabellisationPreuveErrorConfig
  );

  router = this.trpc.router({
    listPreuvesLabellisation: this.trpc.authedProcedure
      .input(listePreuvesLabellisationInputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result = await this.listePreuvesService.listPreuvesLabellisation(
          input,
          user
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
