import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { actionScoreSchema } from './action-score.dto';

export const getActionScoresResponseSchema = extendApi(
  z.record(z.string(), actionScoreSchema),
).openapi({
  title: 'Scores des actions',
});
export type GetActionScoresResponseType = z.infer<
  typeof getActionScoresResponseSchema
>;
