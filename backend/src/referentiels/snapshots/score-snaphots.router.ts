import { Injectable } from '@nestjs/common';
import z from 'zod';
import { TrpcService } from '../../trpc/trpc.service';
import { ReferentielType } from '../models/referentiel.enum';
import { ScoreJalon } from '../models/score-jalon.enum';
import ReferentielsScoringSnapshotsService from '../services/referentiels-scoring-snapshots.service';
import ReferentielsScoringService from '../services/referentiels-scoring.service';

export const getScoreSnapshotInfosTrpcRequestSchema = z.object({
  referentielId: z.nativeEnum(ReferentielType),
  collectiviteId: z.number().int(),
  parameters: z.object({
    typesJalon: z.nativeEnum(ScoreJalon).array(),
  }),
});

export const getFullScoreSnapshotTrpcRequestSchema = z.object({
  referentielId: z.nativeEnum(ReferentielType),
  collectiviteId: z.number().int(),
  snapshotRef: z.string(),
});

@Injectable()
export class ScoreSnapshotsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ReferentielsScoringSnapshotsService,
    private readonly referentielsScoringService: ReferentielsScoringService
  ) {}

  router = this.trpc.router({
    listSummary: this.trpc.authedProcedure
      .input(getScoreSnapshotInfosTrpcRequestSchema)
      .query(({ input, ctx }) => {
        return this.service.listSummary(
          input.collectiviteId,
          input.referentielId,
          input.parameters
        );
      }),
    getCurrentFullScore: this.trpc.authedProcedure
      .input(
        z.object({
          referentielId: z.nativeEnum(ReferentielType),
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
        if (
          input.snapshotRef ===
          ReferentielsScoringSnapshotsService.SCORE_COURANT_SNAPSHOT_REF
        ) {
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
