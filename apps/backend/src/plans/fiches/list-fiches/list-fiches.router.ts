import { Injectable } from '@nestjs/common';
import { listFichesInputSchema } from '@tet/backend/plans/fiches/list-fiches/list-fiches.request';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import z from 'zod';
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
        return await this.service.getFicheById(id, false, ctx.user);
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
