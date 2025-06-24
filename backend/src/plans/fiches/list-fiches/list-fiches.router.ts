import { listFichesRequestSchema } from '@/backend/plans/fiches/list-fiches/list-fiches.request';
import { LIMIT_DEFAULT, PAGE_DEFAULT } from '@/backend/utils/pagination.schema';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import ListFichesService from './list-fiches.service';

@Injectable()
export class ListFichesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ListFichesService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listFichesRequestSchema)
      .query(async ({ input }) => {
        const { collectiviteId, filters, queryOptions } = input;

        return await this.service.getFichesAction(collectiviteId, filters, {
          sort: queryOptions?.sort,
          page: queryOptions?.page ?? PAGE_DEFAULT,
          limit: queryOptions?.limit ?? LIMIT_DEFAULT,
        });
      }),

    listWithCount: this.trpc.authedProcedure
      .input(listFichesRequestSchema)
      .query(async ({ input }) => {
        const { collectiviteId, filters, queryOptions } = input;

        return await this.service.getFichesActionWithCount(
          collectiviteId,
          filters,
          {
            sort: queryOptions?.sort,
            page: queryOptions?.page ?? PAGE_DEFAULT,
            limit: queryOptions?.limit ?? LIMIT_DEFAULT,
          }
        );
      }),

    listResumes: this.trpc.authedProcedure
      .input(listFichesRequestSchema)
      .query(async ({ input }) => {
        const { collectiviteId, filters, queryOptions } = input;
        return this.service.getFichesActionResumes(collectiviteId, filters, {
          sort: queryOptions?.sort,
          page: queryOptions?.page ?? PAGE_DEFAULT,
          limit: queryOptions?.limit ?? LIMIT_DEFAULT,
        });
      }),
  });
}
