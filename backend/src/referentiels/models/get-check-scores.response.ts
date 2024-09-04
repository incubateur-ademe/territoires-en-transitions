import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { actionScoreSchema } from './action-score.dto';

export const getCheckScoresResponseSchema = extendApi(
  z.object({
    date: z.string().datetime(),
    differences: z.record(
      z.string(),
      z.object({
        calcule: actionScoreSchema.partial(),
        sauvegarde: actionScoreSchema.partial(),
      })
    ),
  })
).openapi({
  title: 'Résultat de la vérification de calcul de score',
});
export type GetCheckScoresResponseType = z.infer<
  typeof getCheckScoresResponseSchema
>;
