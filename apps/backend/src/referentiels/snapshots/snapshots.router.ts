import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ResourceType } from '@tet/backend/users/authorizations/resource-type.enum';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import { PermissionOperationEnum } from '@tet/domain/users';
import z from 'zod';
import {
  listInputSchema,
  ListSnapshotsService,
} from './list-snapshots/list-snapshots.service';
import { SnapshotsService } from './snapshots.service';
import { upsertSnapshotInputSchema } from './upsert-snapshot.input';

export const snapshotInputSchema = z.object({
  referentielId: referentielIdEnumSchema,
  collectiviteId: z.number().int(),
  snapshotRef: z.string(),
});

export const updateSnapshotNameInputSchema = snapshotInputSchema.extend({
  newName: z.string(),
});

@Injectable()
export class SnapshotsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly snapshots: SnapshotsService,
    private readonly listSnapshots: ListSnapshotsService,
    private readonly permissionService: PermissionService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listInputSchema)
      .query(({ input }) => {
        return this.listSnapshots.list(input);
      }),

    listWithScores: this.trpc.authedProcedure
      .input(listInputSchema)
      .query(({ input }) => {
        return this.listSnapshots.listWithScores(input);
      }),

    computeAndUpsert: this.trpc.authedProcedure
      .input(upsertSnapshotInputSchema)
      .mutation(async ({ input, ctx }) => {
        await this.permissionService.isAllowed(
          ctx.user,
          PermissionOperationEnum['REFERENTIELS.MUTATE'],
          ResourceType.COLLECTIVITE,
          input.collectiviteId
        );

        return this.snapshots.computeAndUpsert({
          ...input,
          user: ctx.user,
        });
      }),

    getCurrent: this.trpc.anonProcedure
      .input(
        z.object({
          referentielId: referentielIdEnumSchema,
          collectiviteId: z.number().int(),
        })
      )
      .query(({ input, ctx }) => {
        return this.snapshots.get(
          input.collectiviteId,
          input.referentielId,
          undefined,
          ctx.user
        );
      }),

    forceRecompute: this.trpc.authedProcedure
      .input(
        z.object({
          referentielId: referentielIdEnumSchema,
          collectiviteId: z.number().int(),
          snapshotRef: z.string(),
        })
      )
      .query(async ({ input, ctx }) => {
        // Only allowed for service role
        this.permissionService.hasServiceRole(ctx.user);

        return this.snapshots.forceRecompute(
          input.collectiviteId,
          input.referentielId,
          input.snapshotRef,
          ctx.user
        );
      }),

    updateName: this.trpc.authedProcedure
      .input(updateSnapshotNameInputSchema)
      .mutation(async ({ input, ctx }) => {
        await this.permissionService.isAllowed(
          ctx.user,
          PermissionOperationEnum['REFERENTIELS.MUTATE'],
          ResourceType.COLLECTIVITE,
          input.collectiviteId
        );

        return this.snapshots.updateName(
          input.collectiviteId,
          input.referentielId,
          input.snapshotRef,
          input.newName
        );
      }),

    delete: this.trpc.authedProcedure
      .input(snapshotInputSchema)
      .mutation(async ({ input, ctx }) => {
        await this.permissionService.isAllowed(
          ctx.user,
          PermissionOperationEnum['REFERENTIELS.MUTATE'],
          ResourceType.COLLECTIVITE,
          input.collectiviteId
        );

        return this.snapshots.delete(
          input.collectiviteId,
          input.referentielId,
          input.snapshotRef,
          ctx.user
        );
      }),
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
