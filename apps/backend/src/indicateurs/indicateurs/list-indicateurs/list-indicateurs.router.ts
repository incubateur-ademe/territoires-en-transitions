import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getFavorisCountRequestSchema } from './get-favoris-count.request';
import { getPathRequestSchema } from './get-path.request';
import { listIndicateursInputSchema } from './list-indicateurs.input';
import { ListIndicateursService } from './list-indicateurs.service';

@Injectable()
export class ListIndicateursRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ListIndicateursService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listIndicateursInputSchema)
      .query(async ({ ctx, input }) => {
        return await this.service.listIndicateurs(input, ctx.user);
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
