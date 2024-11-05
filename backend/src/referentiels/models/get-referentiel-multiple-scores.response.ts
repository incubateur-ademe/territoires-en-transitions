import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { getReferentielScoresResponseSchema } from './get-referentiel-scores.response';

export const getReferentielMultipleScoresResponseSchema = extendApi(
  z.object({
    collectiviteScores: getReferentielScoresResponseSchema.array(),
  })
).openapi({
  title: 'Score des différentes collectivités pour un référentiel',
});
export type GetReferentielMultipleScoresResponseType = z.infer<
  typeof getReferentielMultipleScoresResponseSchema
>;
