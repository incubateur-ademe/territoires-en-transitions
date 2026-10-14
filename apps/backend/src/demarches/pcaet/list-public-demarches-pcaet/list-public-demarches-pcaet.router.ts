import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listPublicDemarchesPcaetErrorConfig } from './list-public-demarches-pcaet.errors';
import { listPublicDemarchesPcaetInputSchema } from './list-public-demarches-pcaet.input';
import { ListPublicDemarchesPcaetService } from './list-public-demarches-pcaet.service';

@Injectable()
export class ListPublicDemarchesPcaetRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listPublicDemarchesPcaetService: ListPublicDemarchesPcaetService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listPublicDemarchesPcaetErrorConfig
  );

  router = this.trpc.router({
    listPublic: this.trpc.authedProcedure
      .input(listPublicDemarchesPcaetInputSchema)
      .query(async ({ input, ctx }) => {
        const result =
          await this.listPublicDemarchesPcaetService.listPublicDemarchesPcaet(
            input,
            { user: ctx.user }
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
