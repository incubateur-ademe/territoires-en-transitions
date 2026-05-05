import { Injectable } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listActionsGroupedByIdInputSchema } from './list-actions-grouped-by-id.input';
import { ListActionsService } from './list-actions.service';

@Injectable()
export class ListActionsRouter {
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
        return this.listActionsService.listActionsGroupedById(input, { user });
      }),
  });
}
