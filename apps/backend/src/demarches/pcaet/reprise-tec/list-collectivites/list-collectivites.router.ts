import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listCollectivitesErrorConfig } from './list-collectivites.errors';
import { ListCollectivitesService } from './list-collectivites.service';

@Injectable()
export class ListCollectivitesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listCollectivitesService: ListCollectivitesService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listCollectivitesErrorConfig
  );

  router = this.trpc.router({
    listCollectivites: this.trpc.authedProcedure.query(async ({ ctx }) =>
      this.getResultDataOrThrowError(
        await this.listCollectivitesService.listCollectivites({
          user: ctx.user,
        })
      )
    ),
  });
}
