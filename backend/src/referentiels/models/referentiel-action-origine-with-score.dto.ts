import { z } from 'zod';
import { actionPointScoreSchema } from './action-point-score.dto';
import { referentielActionOrigineSchema } from './referentiel-action-origine.dto';

export const referentielActionOrigineWithScoreSchema =
  referentielActionOrigineSchema.extend({
    score: actionPointScoreSchema.nullable(),
  });

export type ReferentielActionOrigineWithScoreType = z.infer<
  typeof referentielActionOrigineWithScoreSchema
>;
