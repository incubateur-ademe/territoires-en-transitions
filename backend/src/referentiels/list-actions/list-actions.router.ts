import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { PermissionOperation, ResourceType } from '@/domain/auth';
import { Injectable } from '@nestjs/common';
import z from 'zod';
import { ListActionDefinitionsService } from '../list-action-definitions/list-action-definitions.service';
import { ReferentielsScoringSnapshotsService } from '../snapshots/referentiels-scoring-snapshots.service';
import { getExtendActionWithComputedStatutsFields } from '../snapshots/snapshots.utils';
import { ActionTypeEnum, actionTypeSchema } from './../models/action-type.enum';

export const inputSchema = z.object({
  collectiviteId: z.number(),
  actionIds: z.string().array().optional(),
  actionTypes: actionTypeSchema
    .array()
    .optional()
    .default([ActionTypeEnum.ACTION, ActionTypeEnum.SOUS_ACTION]),
});

@Injectable()
export class ListActionsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly permissions: PermissionService,
    private readonly snapshotService: ReferentielsScoringSnapshotsService,
    private readonly listActionDefinitionsService: ListActionDefinitionsService
  ) {}

  router = this.trpc.router({
    listActions: this.trpc.authedProcedure
      .input(inputSchema)
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

          return this.listActionDefinitionsService.listActionDefinitions({
            actionIds,
            actionTypes,
          });
        }
      ),

    listActionsWithStatuts: this.trpc.authedProcedure
      .input(inputSchema)
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
              actionIds,
              actionTypes,
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
