import { z } from 'zod';
import { scoresPayloadSchema } from '../snapshots/scores-payload.dto';

export const getReferentielMultipleScoresResponseSchema = z
  .object({
    referentielVersion: z.string(),
    collectiviteScores: scoresPayloadSchema.array(),
  })
  .describe('Score des différentes collectivités pour un référentiel');
export type GetReferentielMultipleScoresResponseType = z.infer<
  typeof getReferentielMultipleScoresResponseSchema
>;
