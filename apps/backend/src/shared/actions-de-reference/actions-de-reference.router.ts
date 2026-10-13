import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import {
  getActionDeReferenceInputSchema,
  listActionsDeReferenceInputSchema,
  listFichesActionDeReferenceInputSchema,
  updateActionDeReferenceInputSchema,
} from '@tet/domain/shared';
import { actionsDeReferenceErrorConfig } from './actions-de-reference.trpc-errors';
import { GetActionDeReferenceService } from './get-action-de-reference/get-action-de-reference.service';
import { ListActionsDeReferenceService } from './list-actions-de-reference/list-actions-de-reference.service';
import { ListFichesActionDeReferenceService } from './list-fiches-action-de-reference/list-fiches-action-de-reference.service';
import { UpdateActionDeReferenceService } from './update-action-de-reference/update-action-de-reference.service';

@Injectable()
export class ActionsDeReferenceRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getActionDeReferenceService: GetActionDeReferenceService,
    private readonly listActionsDeReferenceService: ListActionsDeReferenceService,
    private readonly listFichesActionDeReferenceService: ListFichesActionDeReferenceService,
    private readonly updateActionDeReferenceService: UpdateActionDeReferenceService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    actionsDeReferenceErrorConfig
  );

  router = this.trpc.router({
    get: this.trpc.authedProcedure
      .input(getActionDeReferenceInputSchema)
      .query(async ({ input }) => {
        const getResult = await this.getActionDeReferenceService.getAction(
          input
        );
        return this.getResultDataOrThrowError(getResult);
      }),
    list: this.trpc.authedProcedure
      .input(listActionsDeReferenceInputSchema)
      .query(async ({ input }) => {
        const listResult = await this.listActionsDeReferenceService.listActions(
          input
        );
        return this.getResultDataOrThrowError(listResult);
      }),
    listFiches: this.trpc.authedProcedure
      .input(listFichesActionDeReferenceInputSchema)
      .query(async ({ input, ctx }) => {
        const listFichesResult =
          await this.listFichesActionDeReferenceService.listFiches(input, {
            user: ctx.user,
          });
        return this.getResultDataOrThrowError(listFichesResult);
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
