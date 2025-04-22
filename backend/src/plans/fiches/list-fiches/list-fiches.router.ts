import { getFichesRequestSchema } from '@/backend/plans/fiches/shared/fetch-fiches-filter.request';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import FicheActionListService from '../fiches-action-list.service';

@Injectable()
export class FicheActionListRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: FicheActionListService
  ) {}

  router = this.trpc.router({
    listResumes: this.trpc.authedProcedure
      .input(getFichesRequestSchema)
      .query(async ({ input }) => {
        const { collectiviteId, filters, queryOptions } = input;

        const fiches = await this.service.getFichesActionResumes(
          collectiviteId,
          filters,
          {
            sort: queryOptions?.sort,
            page: queryOptions?.page!,
            limit: queryOptions?.limit!,
          }
        );

        return fiches;
      }),
  });
}
