import { TrpcService } from '@/backend/utils';
import { Injectable } from '@nestjs/common';
import { getFilteredIndicateursRequestSchema } from './get-filtered-indicateurs.request';
import IndicateurFiltreService from './indicateur-filtre.service';

@Injectable()
export class IndicateurFiltreRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: IndicateurFiltreService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(getFilteredIndicateursRequestSchema)
      .query(({ ctx, input }) => {
        const { collectiviteId, filtre, queryOptions } = input;
        return this.service.getFilteredIndicateurs(
          collectiviteId,
          filtre,
          queryOptions,
          ctx.user
        );
      }),
  });
}
