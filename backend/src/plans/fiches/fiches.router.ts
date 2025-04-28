import FicheActionListService from '@/backend/plans/fiches/fiches-action-list.service';
import { getFichesRequestSchema } from '@/backend/plans/fiches/shared/get-fiches-filter.request';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ListFichesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: FicheActionListService
  ) {}

  router = this.trpc.router({
    listResumes: this.trpc.authedProcedure
      .input(getFichesRequestSchema)
      .query(({ input, ctx }) => {
        return this.service.getFichesActionResumes(
          input.collectiviteId,
          input.filters,
          {
            page: input.queryOptions?.page!,
            limit: input.queryOptions?.limit!,
            sort: input.queryOptions?.sort!,
          }
        );
      }),
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
