import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { actionScoreSchema } from '../../../../packages/domain/src/referentiels/models/action-score.dto';

export const getActionScoresResponseSchema = extendApi(
  z.record(z.string(), actionScoreSchema)
).describe('Scores des actions');
export type GetActionScoresResponseType = z.infer<
  typeof getActionScoresResponseSchema
>;
