import { Injectable } from '@nestjs/common';
import { collectiviteIdInputSchemaCoerce } from '@tet/backend/collectivites/collectivite-id.input';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ImportTrajectoireSnbc3Router } from '../import-snbc3/import-trajectoire-snbc3.router';
import { trajectoireSnbc3ErrorConfig } from './trajectoire-snbc3.errors';
import { TrajectoireSnbc3Service } from './trajectoire-snbc3.service';

/**
 * `indicateurs.trajectoires.snbc3` : import (service role) et lecture, à côté
 * de `trajectoires.snbc`, qui reste inchangé jusqu'à la généralisation (lot 6).
 */
@Injectable()
export class TrajectoireSnbc3Router {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    trajectoireSnbc3ErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly service: TrajectoireSnbc3Service,
    private readonly importRouter: ImportTrajectoireSnbc3Router
  ) {}

  router = this.trpc.mergeRouters(
    this.importRouter.router,
    this.trpc.router({
      /** Disponibilité de la trajectoire SNBC 3 pour la collectivité. */
      checkStatus: this.trpc.authedProcedure
        .input(collectiviteIdInputSchemaCoerce)
        .query(async ({ input, ctx }) =>
          this.getResultDataOrThrowError(
            await this.service.checkStatus(input, { user: ctx.user })
          )
        ),

      /** Trajectoire SNBC 3 de la collectivité, regroupée par indicateur. */
      get: this.trpc.authedProcedure
        .input(collectiviteIdInputSchemaCoerce)
        .query(async ({ input, ctx }) =>
          this.getResultDataOrThrowError(
            await this.service.get(input, { user: ctx.user })
          )
        ),
    })
  );
}
