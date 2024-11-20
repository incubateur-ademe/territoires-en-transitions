import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { actionScoreSchema } from './action-score.dto';
import { CheckScoreStatus } from './check-score-status.enum';
import { ReferentielType } from './referentiel.enum';

export const getCheckScoresResponseSchema = extendApi(
  z.object({
    collectiviteId: z.number(),
    referentielId: z.nativeEnum(ReferentielType),
    date: z.string().datetime(),
    verification_status: z.nativeEnum(CheckScoreStatus),
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
