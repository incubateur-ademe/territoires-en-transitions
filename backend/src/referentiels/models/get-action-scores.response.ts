import { z } from 'zod';
import { actionScoreSchema } from './action-score.dto';

export const getActionScoresResponseSchema = z
  .record(z.string(), actionScoreSchema)
  .describe('Scores des actions');
export type GetActionScoresResponseType = z.infer<
  typeof getActionScoresResponseSchema
>;
