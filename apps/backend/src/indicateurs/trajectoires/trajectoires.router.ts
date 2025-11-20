import { Injectable } from '@nestjs/common';
import { collectiviteIdInputSchemaCoerce } from '@tet/backend/collectivites/collectivite-id.input';
import { TrajectoireLeviersRouter } from '@tet/backend/indicateurs/trajectoire-leviers/trajectoire-leviers.router';
import {
  calculTrajectoireRequestSchema,
  CalculTrajectoireReset,
} from '@tet/backend/indicateurs/trajectoires/calcul-trajectoire.request';
import TrajectoiresDataService from '@tet/backend/indicateurs/trajectoires/trajectoires-data.service';
import { verificationTrajectoireRequestSchema } from '@tet/backend/indicateurs/trajectoires/verification-trajectoire.request';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import TrajectoiresSpreadsheetService from './trajectoires-spreadsheet.service';

@Injectable()
export class TrajectoiresRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly trajectoiresSpreadsheetService: TrajectoiresSpreadsheetService,
    private readonly trajectoiresDataService: TrajectoiresDataService,
    private readonly trajectoireLeviersRouter: TrajectoireLeviersRouter
  ) {}

  router = this.trpc.router({
    leviers: this.trajectoireLeviersRouter.router,

    snbc: this.trpc.router({
      getOrCompute: this.trpc.authedOrServiceRoleProcedure
        .input(calculTrajectoireRequestSchema)
        .query(({ input, ctx }) => {
          return this.trajectoiresSpreadsheetService.calculeTrajectoireSnbc(
            input,
            ctx.user
          );
        }),

      compute: this.trpc.authedOrServiceRoleProcedure
        .input(collectiviteIdInputSchemaCoerce)
        .mutation(({ input, ctx }) => {
          return this.trajectoiresSpreadsheetService.calculeTrajectoireSnbc(
            {
              collectiviteId: input.collectiviteId,
              mode: CalculTrajectoireReset.MAJ_SPREADSHEET_EXISTANT,
              forceUtilisationDonneesCollectivite: true,
            },
            ctx.user
          );
        }),

      checkStatus: this.trpc.authedOrServiceRoleProcedure
        .input(verificationTrajectoireRequestSchema)
        .query(({ input, ctx }) => {
          return this.trajectoiresDataService.verificationDonneesSnbc({
            request: input,
            tokenInfo: ctx.user,
            epci: undefined,
            doNotThrowIfUnauthorized: true,
          });
        }),
      delete: this.trpc.authedOrServiceRoleProcedure
        .input(collectiviteIdInputSchemaCoerce)
        .mutation(({ input, ctx }) => {
          return this.trajectoiresDataService.deleteTrajectoireSnbc(
            input.collectiviteId,
            undefined,
            ctx.user
          );
        }),
    }),
  });
}
