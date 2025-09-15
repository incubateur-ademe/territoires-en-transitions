import {
  listFichesRequestWithLimitSchema,
  listFichesRequestWithoutLimitSchema,
} from '@/backend/plans/fiches/list-fiches/list-fiches.request';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';
import ListFichesService from './list-fiches.service';
@Injectable()
export class ListFichesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ListFichesService
  ) { }

  router = this.trpc.router({
    get: this.trpc.authedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const { id } = input;
        return await this.service.getFicheById(id, false, ctx.user);
      }),

    listFilteredFiches: this.trpc.authedProcedure
      .input(listFichesRequestWithLimitSchema)
      .query(async ({ input, ctx }) => {
        const { collectiviteId, axesId, filters, queryOptions } = input;

        return this.service.getFilteredFiches({
          collectiviteId,
          axesId,
          filters: filters ?? {},
          queryOptions,
          user: ctx.user,
        });
      }),
    listAllFilteredFiches: this.trpc.authedProcedure
      .input(listFichesRequestWithoutLimitSchema)
      .query(async ({ input }) => {
        const { collectiviteId, axesId, filters, queryOptions } = input;
        return this.service.getAllFilteredFiches({
          collectiviteId,
          axesId,
          filters,
          queryOptions,
        });
      }),
  });
}
