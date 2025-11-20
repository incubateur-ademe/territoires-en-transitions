import { actionScoreWithOnlyPointsAndStatutsSchema } from '@tet/domain/referentiels';
import { z } from 'zod';
import { correlatedActionSchema } from './referentiel-action-origine.dto';

export const corelatedActionWithScoreSchema = correlatedActionSchema.extend({
  score: actionScoreWithOnlyPointsAndStatutsSchema.nullable(),
});

export type CorrelatedActionWithScore = z.infer<
  typeof corelatedActionWithScoreSchema
>;
