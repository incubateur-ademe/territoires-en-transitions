import { z } from 'zod';

export const checkReferentielScoresRequestSchema = z
  .object({
    utiliseDatePourScoreCourant: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional()
      .describe(
        `Indique si la date sauvegardée dans le score courant doit être utilisée pour recalculer le score courant. Par défaut, la date n'est pas précisée.`
      ),
    notification: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional()
      .describe(
        `Indique si une notification doit être envoyée en cas d'erreur.`
      ),
  })
  .describe(
    "Paramètres de la requête pour vérifier les scores entre l'ancien (python) et le nouveau (backend typescript) moteur de calul pour un référentiel donné"
  );
export type CheckReferentielScoresRequestType = z.infer<
  typeof checkReferentielScoresRequestSchema
>;
