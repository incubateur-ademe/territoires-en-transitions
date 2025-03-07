import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';
import ScoresService from '../compute-score/scores.service';
import { ComputeScoreMode } from '../models/compute-scores-mode.enum';
import { referentielIdEnumSchema } from '../models/referentiel-id.enum';
import {
  listInputSchema,
  ListSnapshotsService,
} from './list-snapshots/list-snapshots.service';
import { SnapshotsService } from './snapshots.service';
import { upsertSnapshotRequestSchema } from './upsert-snapshot.request';

export const getFullScoreSnapshotTrpcRequestSchema = z.object({
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
    private readonly scores: ScoresService
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

    computeAndSave: this.trpc.authedProcedure
      .input(
        z.object({
          collectiviteId: z.number().int(),
          referentielId: referentielIdEnumSchema,
        })
      )
      .mutation(({ input }) => {
        return this.scores.getOrCreateCurrentScore(
          input.collectiviteId,
          input.referentielId,
          true
        );
      }),

    upsert: this.trpc.authedProcedure
      .input(upsertSnapshotRequestSchema)
      .mutation(({ input, ctx }) => {
        return this.scores.computeScoreForCollectivite(
          input.referentiel,
          input.collectiviteId,
          {
            mode: ComputeScoreMode.RECALCUL,
            snapshot: true,
            snapshotNom: input.snapshotNom,
            date: input.date,
          },
          ctx.user
        );
      }),

    getCurrentFullScore: this.trpc.authedProcedure
      .input(
        z.object({
          referentielId: referentielIdEnumSchema,
          collectiviteId: z.number().int(),
        })
      )
      .query(({ input, ctx }) => {
        return this.scores.getOrCreateCurrentScore(
          input.collectiviteId,
          input.referentielId
        );
      }),

    get: this.trpc.authedProcedure
      .input(getFullScoreSnapshotTrpcRequestSchema)
      .query(({ input, ctx }) => {
        if (input.snapshotRef === SnapshotsService.SCORE_COURANT_SNAPSHOT_REF) {
          return this.scores.getOrCreateCurrentScore(
            input.collectiviteId,
            input.referentielId
          );
        } else {
          return this.snapshots.get(
            input.collectiviteId,
            input.referentielId,
            input.snapshotRef
          );
        }
      }),
    delete: this.trpc.authedProcedure
      .input(getFullScoreSnapshotTrpcRequestSchema)
      .query(({ input, ctx }) => {
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
