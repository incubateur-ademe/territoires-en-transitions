import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { listIndicateursRequestSchema } from './list-indicateurs.request';
import ListIndicateursService from './list-indicateurs.service';

@Injectable()
export class ListIndicateursRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ListIndicateursService
  ) { }

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listIndicateursRequestSchema)
      .query(({ ctx, input }) => {
        const { collectiviteId, filtre, queryOptions } = input;
        return this.service.listIndicateurs(
          collectiviteId,
          filtre,
          queryOptions,
          ctx.user
        );
      }),
  });
}
