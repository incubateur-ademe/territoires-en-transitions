import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import {
  listActionsDeReferenceInputSchema,
  updateActionDeReferenceInputSchema,
} from '@tet/domain/shared';
import { actionsDeReferenceErrorConfig } from './actions-de-reference.trpc-errors';
import { ListActionsDeReferenceService } from './list-actions-de-reference/list-actions-de-reference.service';
import { UpdateActionDeReferenceService } from './update-action-de-reference/update-action-de-reference.service';

@Injectable()
export class ActionsDeReferenceRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listActionsDeReferenceService: ListActionsDeReferenceService,
    private readonly updateActionDeReferenceService: UpdateActionDeReferenceService
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
    update: this.trpc.authedProcedure
      .input(updateActionDeReferenceInputSchema)
      .mutation(async ({ input, ctx }) => {
        const updateResult =
          await this.updateActionDeReferenceService.updateAction(input, {
            user: ctx.user,
          });
        return this.getResultDataOrThrowError(updateResult);
      }),
  });
}
