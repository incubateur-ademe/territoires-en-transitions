import { z } from 'zod';
import { scoreSchema } from '../compute-score/score.dto';
import { CheckScoreStatus } from './check-score-status.enum';
import { referentielIdEnumSchema } from './referentiel-id.enum';

export const getCheckScoresResponseSchema = z
  .object({
    collectiviteId: z.number(),
    referentielId: referentielIdEnumSchema,
    date: z.string().datetime(),
    verification_status: z.nativeEnum(CheckScoreStatus),
    differences: z.record(
      z.string(),
      z.object({
        calcule: scoreSchema.partial(),
        sauvegarde: scoreSchema.partial(),
      })
    ),
  })
  .describe('Résultat de la vérification de calcul de score');
export type GetCheckScoresResponseType = z.infer<
  typeof getCheckScoresResponseSchema
>;
