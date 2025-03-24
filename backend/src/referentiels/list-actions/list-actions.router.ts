import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { PermissionOperation, ResourceType } from '@/backend/auth/index-domain';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { ListActionDefinitionsService } from '../list-action-definitions/list-action-definitions.service';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { getExtendActionWithComputedStatutsFields } from '../snapshots/snapshots.utils';
import {
  listActionsRequestSchema,
  listActionsWithStatusRequestSchema,
} from './list-actions.request';

@Injectable()
export class ListActionsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly permissions: PermissionService,
    private readonly snapshotService: SnapshotsService,
    private readonly listActionDefinitionsService: ListActionDefinitionsService
  ) {}

  router = this.trpc.router({
    listActions: this.trpc.authedProcedure
      .input(listActionsRequestSchema)
      .query(async ({ input, ctx: { user } }) => {
        const { collectiviteId, filters } = input;

        await this.permissions.isAllowed(
          user,
          PermissionOperation.REFERENTIELS_LECTURE,
          ResourceType.COLLECTIVITE,
          collectiviteId
        );

        const actionDefinitions =
          await this.listActionDefinitionsService.listActionDefinitions({
            collectiviteId,
            filters,
          });

        const extendActionWithScores = getExtendActionWithComputedStatutsFields(
          collectiviteId,
          this.snapshotService.get.bind(this.snapshotService)
        );

        return Promise.all(actionDefinitions.map(extendActionWithScores));
      }),

    listActionsWithStatuts: this.trpc.authedProcedure
      .input(listActionsWithStatusRequestSchema)
      .query(
        async ({
          input: { collectiviteId, actionIds, actionTypes },
          ctx: { user },
        }) => {
          await this.permissions.isAllowed(
            user,
            PermissionOperation.REFERENTIELS_LECTURE,
            ResourceType.COLLECTIVITE,
            collectiviteId
          );

          const actionDefinitions =
            await this.listActionDefinitionsService.listActionDefinitions({
              collectiviteId,
              filters: {
                actionIds,
                actionTypes,
              },
            });

          const extendActionWithScores =
            getExtendActionWithComputedStatutsFields(
              collectiviteId,
              this.snapshotService.get.bind(this.snapshotService)
            );

          return Promise.all(actionDefinitions.map(extendActionWithScores));
        }
      ),
  });
}
