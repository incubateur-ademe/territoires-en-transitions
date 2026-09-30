import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listActionsDeReferenceInputSchema } from '@tet/domain/shared';
import { actionsDeReferenceErrorConfig } from './actions-de-reference.trpc-errors';
import { ListActionsDeReferenceService } from './list-actions-de-reference/list-actions-de-reference.service';

@Injectable()
export class ActionsDeReferenceRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listActionsDeReferenceService: ListActionsDeReferenceService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    actionsDeReferenceErrorConfig
  );

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listActionsDeReferenceInputSchema)
      .query(async ({ input }) => {
        const listResult = await this.listActionsDeReferenceService.listActions(
          input
        );
        return this.getResultDataOrThrowError(listResult);
      }),
  });
}
