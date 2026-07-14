import { Injectable } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listActionsGroupedByIdInputSchema } from './list-actions-grouped-by-id.input';
import { listActionsErrorConfig } from './list-actions.errors';
import { ListActionsService } from './list-actions.service';

@Injectable()
export class ListActionsRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listActionsErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly permissions: PermissionService,
    private readonly collectivite: CollectivitesService,
    private readonly listActionsService: ListActionsService
  ) {}

  router = this.trpc.router({
    listActionsGroupedById: this.trpc.authedProcedure
      .input(listActionsGroupedByIdInputSchema)
      .query(async ({ input, ctx: { user } }) => {
        return this.getResultDataOrThrowError(
          await this.listActionsService.listActionsGroupedById(input, { user })
        );
      }),
  });
}
