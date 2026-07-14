import { Injectable } from '@nestjs/common';
import { ReferentielModeGuard } from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import z from 'zod';
import {
  listInputSchema,
  ListSnapshotsService,
} from './list-snapshots/list-snapshots.service';
import { snapshotsErrorConfig } from './snapshots.errors';
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
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    snapshotsErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly snapshots: SnapshotsService,
    private readonly listSnapshots: ListSnapshotsService,
    private readonly permissionService: PermissionService,
    private readonly referentielModeGuard: ReferentielModeGuard
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

        const modeResult = await this.referentielModeGuard.assertCanMutate(
          input.collectiviteId,
          input.referentielId
        );
        this.getResultDataOrThrowError(modeResult);

        return this.getResultDataOrThrowError(
          await this.snapshots.computeAndUpsert(input, { user: ctx.user })
        );
      }),

    getCurrent: this.trpc.anonProcedure
      .input(
        z.object({
          referentielId: referentielIdEnumSchema,
          collectiviteId: z.number().int(),
        })
      )
      .query(async ({ input, ctx }) => {
        return this.getResultDataOrThrowError(
          await this.snapshots.get(
            input.collectiviteId,
            input.referentielId,
            undefined,
            { user: ctx.user }
          )
        );
      }),

    forceRecompute: this.trpc.authedOrServiceRoleProcedure
      .input(
        z.object({
          referentielId: referentielIdEnumSchema,
          collectiviteId: z.number().int(),
          snapshotRef: z.string(),
        })
      )
      .query(async ({ input, ctx }) => {
        // only allowed for service role
        this.permissionService.hasServiceRole(ctx.user);

        return this.getResultDataOrThrowError(
          await this.snapshots.forceRecompute(
            input.collectiviteId,
            input.referentielId,
            input.snapshotRef,
            { user: ctx.user }
          )
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

        const modeResult = await this.referentielModeGuard.assertCanMutate(
          input.collectiviteId,
          input.referentielId
        );
        this.getResultDataOrThrowError(modeResult);

        return this.getResultDataOrThrowError(
          await this.snapshots.updateName(
            input.collectiviteId,
            input.referentielId,
            input.snapshotRef,
            input.newName
          )
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

        const modeResult = await this.referentielModeGuard.assertCanMutate(
          input.collectiviteId,
          input.referentielId
        );
        this.getResultDataOrThrowError(modeResult);

        return this.getResultDataOrThrowError(
          await this.snapshots.delete(
            input.collectiviteId,
            input.referentielId,
            input.snapshotRef,
            { user: ctx.user }
          )
        );
      }),
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
