import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listPersonnalisationReponsesInputSchema } from './list-personnalisation-reponses.input';
import { ListPersonnalisationReponsesService } from './list-personnalisation-reponses.service';

@Injectable()
export class ListPersonnalisationReponsesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listPersonnalisationReponsesService: ListPersonnalisationReponsesService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  router = this.trpc.router({
    listReponses: this.trpc.authedProcedure
      .input(listPersonnalisationReponsesInputSchema)
      .query(async ({ input, ctx }) => {
        const result =
          await this.listPersonnalisationReponsesService.listPersonnalisationReponses(
            input,
            ctx.user
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
