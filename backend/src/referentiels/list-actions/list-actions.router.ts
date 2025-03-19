import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { PermissionOperation, ResourceType } from '@/backend/auth/index-domain';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';
import { ListActionDefinitionsService } from '../list-action-definitions/list-action-definitions.service';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { getExtendActionWithComputedStatutsFields } from '../snapshots/snapshots.utils';
import { ActionTypeEnum, actionTypeSchema } from './../models/action-type.enum';
import { referentielIdEnumSchema } from '../index-domain';

export const inputSchema = z.object({
  collectiviteId: z.number(),
  actionIds: z.string().array().optional(),
  actionTypes: actionTypeSchema
    .array()
    .optional()
    .default([ActionTypeEnum.ACTION, ActionTypeEnum.SOUS_ACTION]),
  relationFilters: z
    .object({
      pilotes: z
        .array(
          z.union([
            z.object({ userId: z.string() }),
            z.object({ tagId: z.number() }),
          ])
        )
        .optional(),
      services: z.array(z.object({ serviceTagId: z.number() })).optional(),
    })
    .optional(),
  referentielIds: referentielIdEnumSchema.array().optional(),
});

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
      .input(inputSchema)
      .query(
        async ({
          input: {
            collectiviteId,
            actionIds,
            actionTypes,
            referentielIds,
            relationFilters,
          },
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
            relationFilters,
            referentielIds,
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
