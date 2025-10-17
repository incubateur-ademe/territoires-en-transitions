import { collectiviteRequestSchema } from '@/backend/collectivites/collectivite.request';
import { TrajectoireLeviersRouter } from '@/backend/indicateurs/trajectoire-leviers/trajectoire-leviers.router';
import {
  calculTrajectoireRequestSchema,
  CalculTrajectoireReset,
} from '@/backend/indicateurs/trajectoires/calcul-trajectoire.request';
import TrajectoiresDataService from '@/backend/indicateurs/trajectoires/trajectoires-data.service';
import { verificationTrajectoireRequestSchema } from '@/backend/indicateurs/trajectoires/verification-trajectoire.request';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
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
        .input(collectiviteRequestSchema)
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
        .input(collectiviteRequestSchema)
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
