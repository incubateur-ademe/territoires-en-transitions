import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getFavorisCountRequestSchema } from './get-favoris-count.request';
import { getPathRequestSchema } from './get-path.request';
import { listIndicateursErrorConfig } from './list-indicateurs.errors';
import { listIndicateursInputSchema } from './list-indicateurs.input';
import { ListIndicateursService } from './list-indicateurs.service';

@Injectable()
export class ListIndicateursRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ListIndicateursService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listIndicateursErrorConfig
  );

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listIndicateursInputSchema)
      .query(async ({ ctx, input }) => {
        return this.getResultDataOrThrowError(
          await this.service.listIndicateurs(input, ctx.user)
        );
      }),
    getPath: this.trpc.authedProcedure
      .input(getPathRequestSchema)
      .query(async ({ ctx, input }) => {
        return this.getResultDataOrThrowError(
          await this.service.getPath(input, ctx.user)
        );
      }),
    getFavorisCount: this.trpc.authedProcedure
      .input(getFavorisCountRequestSchema)
      .query(async ({ ctx, input }) => {
        return this.getResultDataOrThrowError(
          await this.service.getFavorisCount(input, ctx.user)
        );
      }),
    getMesIndicateursCount: this.trpc.authedProcedure
      .input(getFavorisCountRequestSchema)
      .query(async ({ ctx, input }) => {
        return this.getResultDataOrThrowError(
          await this.service.getMesIndicateursCount(input, ctx.user)
        );
      }),
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
