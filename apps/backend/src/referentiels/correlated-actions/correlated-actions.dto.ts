import { z } from 'zod';
import { scoreWithOnlyPointsSchema } from '../compute-score/score.dto';
import { corelatedActionWithScoreSchema } from './referentiel-action-origine-with-score.dto';
import { correlatedActionSchema } from './referentiel-action-origine.dto';

export const correlatedActionsFieldsSchema = z.object({
  referentielsOrigine: z.string().array().optional(),
  actionsOrigine: correlatedActionSchema.array().optional(),
});

export type CorrelatedActionsFields = z.infer<
  typeof correlatedActionsFieldsSchema
>;

export const correlatedActionsWithScoreFieldsSchema = z.object({
  referentielsOrigine: z.string().array().optional(),
  actionsOrigine: corelatedActionWithScoreSchema.array().optional(),
  scoresOrigine: z
    .record(z.string(), scoreWithOnlyPointsSchema.nullable())
    .optional(),
});

export type CorrelatedActionsWithScoreFields = z.infer<
  typeof correlatedActionsWithScoreFieldsSchema
>;
