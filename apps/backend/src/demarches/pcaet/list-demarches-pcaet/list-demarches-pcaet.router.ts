import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listDemarchesPcaetErrorConfig } from './list-demarches-pcaet.errors';
import { listDemarchesPcaetInputSchema } from './list-demarches-pcaet.input';
import { ListDemarchesPcaetService } from './list-demarches-pcaet.service';

@Injectable()
export class ListDemarchesPcaetRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDemarchesPcaetService: ListDemarchesPcaetService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listDemarchesPcaetErrorConfig
  );

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listDemarchesPcaetInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.listDemarchesPcaetService.listDemarchesPcaet(
          input,
          { user: ctx.user }
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
