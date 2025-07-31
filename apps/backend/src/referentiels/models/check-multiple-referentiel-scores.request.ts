import { z } from 'zod';
import { checkReferentielScoresRequestSchema } from './check-referentiel-scores.request';

export const checkMultipleReferentielScoresRequestSchema =
  checkReferentielScoresRequestSchema.extend({
    nbJours: z
      .number()
      .int()
      .default(1)
      .describe(
        `Nombre de jours à considérer pour trouver les collectivités dont le score a changé`
      ),
  });
export type CheckMultipleReferentielScoresRequestType = z.infer<
  typeof checkMultipleReferentielScoresRequestSchema
>;
