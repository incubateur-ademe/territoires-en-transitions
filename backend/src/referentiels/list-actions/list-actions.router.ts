import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { PermissionOperation, ResourceType } from '@/backend/auth/index-domain';
import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { listActionsRequestSchema } from './list-actions.request';
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
    listActions: this.trpc.authedProcedure
      .input(listActionsRequestSchema)
      .query(async ({ input, ctx: { user } }) => {
        const { collectiviteId, filters } = input;

        const collectivitePrivate = await this.collectivite.isPrivate(
          collectiviteId
        );

        await this.permissions.isAllowed(
          user,
          collectivitePrivate
            ? PermissionOperation.REFERENTIELS_LECTURE
            : PermissionOperation.REFERENTIELS_VISITE,
          ResourceType.COLLECTIVITE,
          collectiviteId
        );

        return this.listActionsService.listActions({
          collectiviteId,
          filters,
        });
      }),
  });
}
