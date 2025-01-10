import { z } from 'zod';
import { referentielActionOrigineSchema } from './referentiel-action-origine.dto';
import { scoreWithOnlyPointsAndStatutsSchema } from './score.dto';

export const referentielActionOrigineWithScoreSchema =
  referentielActionOrigineSchema.extend({
    score: scoreWithOnlyPointsAndStatutsSchema.nullable(),
  });

export type ReferentielActionOrigineWithScoreType = z.infer<
  typeof referentielActionOrigineWithScoreSchema
>;
