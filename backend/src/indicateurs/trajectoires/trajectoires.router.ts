import { collectiviteRequestSchema } from '@/backend/collectivites/collectivite.request';
import { verificationTrajectoireRequestSchema } from '@/backend/indicateurs/index-domain';
import { calculTrajectoireRequestSchema } from '@/backend/indicateurs/trajectoires/calcul-trajectoire.request';
import TrajectoiresDataService from '@/backend/indicateurs/trajectoires/trajectoires-data.service';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import TrajectoiresSpreadsheetService from './trajectoires-spreadsheet.service';

@Injectable()
export class TrajectoiresRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly trajectoiresSpreadsheetService: TrajectoiresSpreadsheetService,
    private readonly trajectoiresDataService: TrajectoiresDataService
  ) {}

  router = this.trpc.router({
    snbc: this.trpc.router({
      getOrCompute: this.trpc.authedOrServiceRoleProcedure
        .input(calculTrajectoireRequestSchema)
        .query(({ input, ctx }) => {
          return this.trajectoiresSpreadsheetService.calculeTrajectoireSnbc(
            input,
            ctx.user
          );
        }),
      checkStatus: this.trpc.authedOrServiceRoleProcedure
        .input(verificationTrajectoireRequestSchema)
        .query(({ input, ctx }) => {
          return this.trajectoiresDataService.verificationDonneesSnbc(
            input,
            ctx.user,
            undefined,
            undefined,
            true
          );
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
