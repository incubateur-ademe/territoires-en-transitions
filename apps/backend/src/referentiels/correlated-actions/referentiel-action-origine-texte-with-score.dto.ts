import { actionScoreWithOnlyPointsAndStatutsSchema } from '@tet/domain/referentiels';
import { z } from 'zod';
import { correlatedActionTexteSchema } from './referentiel-action-origine-texte.dto';

export const corelatedActionTexteWithScoreSchema =
  correlatedActionTexteSchema.extend({
    score: actionScoreWithOnlyPointsAndStatutsSchema.nullable(),
  });

export type CorrelatedActionTexteWithScore = z.infer<
  typeof corelatedActionTexteWithScoreSchema
>;
