import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listDemarchesCouvrantesErrorConfig } from './list-demarches-couvrantes.errors';
import { listDemarchesCouvrantesInputSchema } from './list-demarches-couvrantes.input';
import { ListDemarchesCouvrantesService } from './list-demarches-couvrantes.service';

@Injectable()
export class ListDemarchesCouvrantesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDemarchesCouvrantesService: ListDemarchesCouvrantesService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listDemarchesCouvrantesErrorConfig
  );

  router = this.trpc.router({
    listCouvrantes: this.trpc.authedProcedure
      .input(listDemarchesCouvrantesInputSchema)
      .query(async ({ input, ctx }) => {
        const result =
          await this.listDemarchesCouvrantesService.listDemarchesCouvrantes(
            input,
            { user: ctx.user }
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
