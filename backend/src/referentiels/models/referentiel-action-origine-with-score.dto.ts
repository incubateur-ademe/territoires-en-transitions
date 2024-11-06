import { z } from 'zod';
import { actionPointScoreWithAvancementSchema } from './action-point-score.dto';
import { referentielActionOrigineSchema } from './referentiel-action-origine.dto';

export const referentielActionOrigineWithScoreSchema =
  referentielActionOrigineSchema.extend({
    score: actionPointScoreWithAvancementSchema.nullable(),
  });

export type ReferentielActionOrigineWithScoreType = z.infer<
  typeof referentielActionOrigineWithScoreSchema
>;
