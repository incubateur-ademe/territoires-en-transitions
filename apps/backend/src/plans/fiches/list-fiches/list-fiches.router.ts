import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import { listFichesInputSchema } from './list-fiches.request';
import ListFichesService from './list-fiches.service';

@Injectable()
export class ListFichesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ListFichesService
  ) {}

  router = this.trpc.router({
    get: this.trpc.authedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const { id } = input;
        const result = await this.service.getFicheById(id, false, ctx.user);
        if (result.success) {
          return result.data;
        }
        throw new TRPCError({ code: 'NOT_FOUND', message: result.error });
      }),

    listFiches: this.trpc.authedProcedure
      .input(listFichesInputSchema)
      .query(async ({ input }) => {
        const { collectiviteId, filters, queryOptions } = input;

        return this.service.getFichesActionResumes(
          {
            collectiviteId,
            filters: filters ?? {},
          },
          queryOptions
        );
      }),
  });
}
