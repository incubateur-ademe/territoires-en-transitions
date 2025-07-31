import { listFichesRequestSchema } from '@/backend/plans/fiches/list-fiches/list-fiches.request';
import { LIMIT_DEFAULT, PAGE_DEFAULT } from '@/backend/utils/pagination.schema';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
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

    listResumes: this.trpc.authedProcedure
      .input(listFichesRequestSchema)
      .query(async ({ input }) => {
        const { collectiviteId, axesId, filters, queryOptions } = input;
        return this.service.getFichesActionResumes(
          { collectiviteId, axesId, filters: filters ?? {} },
          {
            sort: queryOptions?.sort,
            page: queryOptions?.page ?? PAGE_DEFAULT,
            limit: queryOptions?.limit ?? LIMIT_DEFAULT,
          }
        );
      }),
  });
}
