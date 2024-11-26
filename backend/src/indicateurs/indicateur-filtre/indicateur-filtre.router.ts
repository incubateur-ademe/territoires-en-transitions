import { Injectable } from '@nestjs/common';
import { TrpcService } from '../../trpc/trpc.service';
import IndicateurFiltreService from './indicateur-filtre.service';
import {
  getFilteredIndicateursRequestSchema
} from './get-filtered-indicateurs.request';



@Injectable()
export class IndicateurFiltreRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: IndicateurFiltreService
  ) {}

  router = this.trpc.router({
    getFilteredIndicateur: this.trpc.authedProcedure
      .input(getFilteredIndicateursRequestSchema)
      .query(({ ctx, input }) => {
        const { collectiviteId, filtre, queryOptions } = input;
        return {
          indicateurs: this.service.getFilteredIndicateurs(
            collectiviteId,
            filtre,
            queryOptions,
            ctx.user
          ),
        };
      }),
  });
}
