import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { PermissionOperation, ResourceType } from '@/domain/auth';
import { Injectable } from '@nestjs/common';
import z from 'zod';
import ScoresService from '../compute-score/scores.service';
import { referentielIdEnumSchema } from '../models/referentiel-id.enum';
import {
  listInputSchema,
  ListSnapshotsService,
} from './list-snapshots/list-snapshots.service';
import { SnapshotsService } from './snapshots.service';
import { upsertSnapshotRequestSchema } from './upsert-snapshot.request';

export const snapshotInputSchema = z.object({
  referentielId: referentielIdEnumSchema,
  collectiviteId: z.number().int(),
  snapshotRef: z.string(),
});

@Injectable()
export class SnapshotsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly snapshots: SnapshotsService,
    private readonly listSnapshots: ListSnapshotsService,
    private readonly scores: ScoresService,
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
      .input(upsertSnapshotRequestSchema)
      .mutation(async ({ input, ctx }) => {
        await this.permissionService.isAllowed(
          ctx.user,
          PermissionOperation.REFERENTIELS_EDITION,
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

    // get: this.trpc.authedProcedure
    //   .input(getFullScoreSnapshotTrpcRequestSchema)
    //   .query(({ input, ctx }) => {
    //     if (input.snapshotRef === SnapshotsService.SCORE_COURANT_SNAPSHOT_REF) {
    //       return this.scores.getOrCreateCurrentScore(
    //         input.collectiviteId,
    //         input.referentielId
    //       );
    //     } else {
    //       return this.snapshots.get(
    //         input.collectiviteId,
    //         input.referentielId,
    //         input.snapshotRef
    //       );
    //     }
    //   }),

    delete: this.trpc.authedProcedure
      .input(snapshotInputSchema)
      .query(async ({ input, ctx }) => {
        await this.permissionService.isAllowed(
          ctx.user,
          PermissionOperation.REFERENTIELS_EDITION,
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
