import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import { listActionSummariesRequestSchema } from '@/backend/referentiels/list-actions/list-action-summaries.request';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import {
  PermissionOperationEnum,
  ResourceType,
} from '@/backend/users/index-domain';
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
            ? PermissionOperationEnum['REFERENTIELS.LECTURE']
            : PermissionOperationEnum['REFERENTIELS.VISITE'],
          ResourceType.COLLECTIVITE,
          collectiviteId
        );

        return this.listActionsService.listActions({
          collectiviteId,
          filters,
        });
      }),

    listActionSummaries: this.trpc.authedProcedure
      .input(listActionSummariesRequestSchema)
      .query(async ({ input }) => {
        // pas de vérification de droits à part être authentifié
        return this.listActionsService.listActionSummaries(input);
      }),
  });
}
