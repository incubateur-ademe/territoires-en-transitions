import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';
import ScoresService from '../compute-score/scores.service';
import { ComputeScoreMode } from '../models/compute-scores-mode.enum';
import { DEFAULT_SNAPSHOT_JALONS } from '../models/get-score-snapshots.request';
import { referentielIdEnumSchema } from '../models/referentiel-id.enum';
import { SnapshotJalon } from './snapshot-jalon.enum';
import { SnapshotsService } from './snapshots.service';
import { upsertSnapshotRequestSchema } from './upsert-snapshot.request';

export const getScoreSnapshotInfosTrpcRequestSchema = z.object({
  referentielId: referentielIdEnumSchema,
  collectiviteId: z.number().int(),
  parameters: z
    .object({
      typesJalon: z
        .nativeEnum(SnapshotJalon)
        .array()
        .optional()
        .default(DEFAULT_SNAPSHOT_JALONS),
    })
    .optional(),
});

export const getFullScoreSnapshotTrpcRequestSchema = z.object({
  referentielId: referentielIdEnumSchema,
  collectiviteId: z.number().int(),
  snapshotRef: z.string(),
});

export const updateSnapshotNameTrpcRequestSchema = z.object({
  collectiviteId: z.number().int(),
  referentielId: referentielIdEnumSchema,
  snapshotRef: z.string(),
  newName: z.string(),
});

@Injectable()
export class SnapshotsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: SnapshotsService,
    private readonly referentielsScoringService: ScoresService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(getScoreSnapshotInfosTrpcRequestSchema)
      .query(({ input }) => {
        return this.service.list(
          input.collectiviteId,
          input.referentielId,
          input.parameters
        );
      }),

    computeAndSave: this.trpc.authedProcedure
      .input(
        z.object({
          collectiviteId: z.number().int(),
          referentielId: referentielIdEnumSchema,
        })
      )
      .mutation(({ input }) => {
        return this.referentielsScoringService.getOrCreateCurrentScore(
          input.collectiviteId,
          input.referentielId,
          true
        );
      }),

    upsert: this.trpc.authedProcedure
      .input(upsertSnapshotRequestSchema)
      .mutation(({ input, ctx }) => {
        return this.referentielsScoringService.computeScoreForCollectivite(
          input.referentielId,
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

    updateName: this.trpc.authedProcedure
      .input(updateSnapshotNameTrpcRequestSchema)
      .mutation(({ input, ctx }) => {
        return this.service.updateName(
          input.collectiviteId,
          input.referentielId,
          input.snapshotRef,
          input.newName
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
        return this.referentielsScoringService.getOrCreateCurrentScore(
          input.collectiviteId,
          input.referentielId
        );
      }),

    get: this.trpc.authedProcedure
      .input(getFullScoreSnapshotTrpcRequestSchema)
      .query(({ input, ctx }) => {
        if (input.snapshotRef === SnapshotsService.SCORE_COURANT_SNAPSHOT_REF) {
          return this.referentielsScoringService.getOrCreateCurrentScore(
            input.collectiviteId,
            input.referentielId
          );
        } else {
          return this.service.get(
            input.collectiviteId,
            input.referentielId,
            input.snapshotRef
          );
        }
      }),
    delete: this.trpc.authedProcedure
      .input(getFullScoreSnapshotTrpcRequestSchema)
      .query(({ input, ctx }) => {
        return this.service.delete(
          input.collectiviteId,
          input.referentielId,
          input.snapshotRef,
          ctx.user
        );
      }),
  });
}
