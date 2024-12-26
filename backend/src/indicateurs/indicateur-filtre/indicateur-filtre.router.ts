import { Injectable } from '@nestjs/common';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import IndicateurFiltreService from './indicateur-filtre.service';
import { getFilteredIndicateursRequestSchema } from './get-filtered-indicateurs.request';

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
