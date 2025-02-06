import { z } from 'zod';
import { scoreWithOnlyPointsAndStatutsSchema } from '../compute-score/score.dto';
import { correlatedActionSchema } from './referentiel-action-origine.dto';

export const corelatedActionWithScoreSchema = correlatedActionSchema.extend({
  score: scoreWithOnlyPointsAndStatutsSchema.nullable(),
});

export type CorrelatedActionWithScore = z.infer<
  typeof corelatedActionWithScoreSchema
>;
