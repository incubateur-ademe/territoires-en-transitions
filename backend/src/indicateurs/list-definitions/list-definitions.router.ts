import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { getFavorisCountRequestSchema } from '../definitions/get-favoris-count.request';
import { getPathRequestSchema } from '../definitions/get-path.request';
import { listDefinitionsRequestSchema } from './list-definitions.request';
import { ListDefinitionsService } from './list-definitions.service';

@Injectable()
export class IndicateurDefinitionsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ListDefinitionsService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listDefinitionsRequestSchema)
      .query(({ ctx, input }) => {
        return this.service.getDefinitionsDetaillees(input, ctx.user);
      }),
    getPath: this.trpc.authedProcedure
      .input(getPathRequestSchema)
      .query(({ ctx, input }) => {
        return this.service.getPath(input, ctx.user);
      }),
    getFavorisCount: this.trpc.authedProcedure
      .input(getFavorisCountRequestSchema)
      .query(({ ctx, input }) => {
        return this.service.getFavorisCount(input, ctx.user);
      }),
  });
}
