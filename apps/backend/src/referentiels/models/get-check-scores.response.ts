import {
  actionScoreSchema,
  referentielIdEnumSchema,
} from '@/domain/referentiels';
import { z } from 'zod';
import { CheckScoreStatus } from './check-score-status.enum';

export const getCheckScoresResponseSchema = z
  .object({
    collectiviteId: z.number(),
    referentielId: referentielIdEnumSchema,
    date: z.iso.datetime(),
    verification_status: z.enum(CheckScoreStatus),
    differences: z.record(
      z.string(),
      z.object({
        calcule: actionScoreSchema.partial(),
        sauvegarde: actionScoreSchema.partial(),
      })
    ),
  })
  .describe('Résultat de la vérification de calcul de score');
export type GetCheckScoresResponseType = z.infer<
  typeof getCheckScoresResponseSchema
>;
