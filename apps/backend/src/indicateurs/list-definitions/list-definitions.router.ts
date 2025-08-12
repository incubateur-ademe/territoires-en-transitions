import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { getFavorisCountRequestSchema } from '../definitions/get-favoris-count.request';
import { getPathRequestSchema } from '../definitions/get-path.request';
import { createIndicateurPersoRequestSchema } from './create-indicateur-perso.request';
import CreateIndicateurPersoService from './create-indicateur-perso.service';
import { listDefinitionsInputSchema } from './list-definitions.input';
import { ListDefinitionsService } from './list-definitions.service';

@Injectable()
export class IndicateurDefinitionsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ListDefinitionsService,
    private readonly createService: CreateIndicateurPersoService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listDefinitionsInputSchema)
      .query(async ({ ctx, input }) => {
        const definitionDetaillees =
          await this.service.getDefinitionsDetaillees(input, ctx.user);
        return definitionDetaillees.data;
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

    createIndicateurPerso: this.trpc.authedProcedure
      .input(createIndicateurPersoRequestSchema)
      .mutation(({ ctx, input }) => {
        return this.createService.create(input, ctx.user);
      }),
  });
}
