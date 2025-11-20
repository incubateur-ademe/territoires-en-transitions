import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getFavorisCountRequestSchema } from './get-favoris-count.request';
import { getPathRequestSchema } from './get-path.request';
import { listDefinitionsInputSchema } from './list-definitions.input';
import { ListDefinitionsService } from './list-definitions.service';

@Injectable()
export class ListDefinitionsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ListDefinitionsService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listDefinitionsInputSchema)
      .query(async ({ ctx, input }) => {
        return await this.service.listDefinitions(input, ctx.user);
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
    getMesIndicateursCount: this.trpc.authedProcedure
      .input(getFavorisCountRequestSchema)
      .query(({ ctx, input }) => {
        return this.service.getMesIndicateursCount(input, ctx.user);
      }),
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
