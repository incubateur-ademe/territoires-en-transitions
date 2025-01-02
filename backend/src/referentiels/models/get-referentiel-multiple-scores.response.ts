import { z } from 'zod';
import { getReferentielScoresResponseSchema } from './get-referentiel-scores.response';

export const getReferentielMultipleScoresResponseSchema = z
  .object({
    referentielVersion: z.string(),
    collectiviteScores: getReferentielScoresResponseSchema.array(),
  })
  .describe('Score des différentes collectivités pour un référentiel');
export type GetReferentielMultipleScoresResponseType = z.infer<
  typeof getReferentielMultipleScoresResponseSchema
>;
