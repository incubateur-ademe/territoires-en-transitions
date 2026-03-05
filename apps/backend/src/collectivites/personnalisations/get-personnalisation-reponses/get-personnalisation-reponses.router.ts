import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getPersonnalisationReponsesInputSchema } from './get-personnalisation-reponses.input';
import { GetPersonnalisationReponsesService } from './get-personnalisation-reponses.service';

@Injectable()
export class GetPersonnalisationReponsesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getPersonnalisationReponsesService: GetPersonnalisationReponsesService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  router = this.trpc.router({
    getReponses: this.trpc.authedProcedure
      .input(getPersonnalisationReponsesInputSchema)
      .query(async ({ input, ctx }) => {
        const result =
          await this.getPersonnalisationReponsesService.getPersonnalisationReponses(
            input,
            ctx.user
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
