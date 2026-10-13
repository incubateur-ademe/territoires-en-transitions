import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listDecisionsErrorConfig } from './list-decisions.errors';
import { ListDecisionsService } from './list-decisions.service';

@Injectable()
export class ListDecisionsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDecisionsService: ListDecisionsService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listDecisionsErrorConfig
  );

  router = this.trpc.router({
    listDecisions: this.trpc.authedProcedure.query(async ({ ctx }) =>
      this.getResultDataOrThrowError(
        await this.listDecisionsService.listDecisions({ user: ctx.user })
      )
    ),
  });
}
