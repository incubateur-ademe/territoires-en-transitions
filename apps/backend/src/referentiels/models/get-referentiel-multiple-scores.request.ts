import { z } from 'zod';
import { getReferentielScoresRequestSchema } from './get-referentiel-scores.request';

export const getReferentielMultipleScoresRequestSchema =
  getReferentielScoresRequestSchema
    .extend({
      collectiviteIds: z
        .string()
        .transform((value) => value.split(','))
        .pipe(z.coerce.number().array())
        .describe(
          'Liste des identifiants de collectivités séparés par des virgules'
        ),
    })
    .describe(
      "Paramètres de la requête pour obtenir les scores de plusieurs collectivités d'un coup."
    );
export type GetReferentielMultipleScoresRequestType = z.infer<
  typeof getReferentielMultipleScoresRequestSchema
>;
