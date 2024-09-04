import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { referentielActionAvecScoreDtoSchema } from './referentiel-action-avec-score.dto';

export const getReferentielScoresResponseSchema = extendApi(
  z.object({
    date: z.string().datetime().optional(),
    scores: referentielActionAvecScoreDtoSchema,
  }),
).openapi({
  title: 'Score de la collectivité pour un référentiel et la date donnée',
});
export type GetReferentielScoresResponseType = z.infer<
  typeof getReferentielScoresResponseSchema
>;
