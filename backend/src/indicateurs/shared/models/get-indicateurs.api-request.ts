import { z } from 'zod';

export const getIndicateursValeursApiRequestSchema = z
  .object({
    collectiviteId: z.coerce
      .number()
      .int()
      .optional()
      .describe('Identifiant de la collectivité'),
    indicateurIds: z.coerce
      .string()
      .transform((value) => value.split(','))
      .pipe(z.coerce.number().array())
      .optional()
      .describe("Identifiant de l'indicateur"),

    identifiantsReferentiel: z
      .string()
      .transform((value) => value.split(','))
      .pipe(z.string().array())
      .optional()
      .describe('Identifiants du référentiel'),
    sources: z
      .string()
      .transform((value) => value.split(','))
      .pipe(z.string().array())
      .optional()
      .describe(
        'Liste des sources (séparées par des virgules). collectivite pour les valeurs renseignées par la collectivité'
      ),
    dateDebut: z
      .string()
      .length(10)
      .optional()
      .describe('Date de début (format YYYY-MM-DD)'),
    dateFin: z
      .string()
      .length(10)
      .optional()
      .describe('Date de fin (format YYYY-MM-DD)'), // z.string().date() only supported in 3.23
  })
  .describe('Filtre de récupération des valeurs des indicateurs');

export type GetIndicateursValeursApiRequestType = z.infer<
  typeof getIndicateursValeursApiRequestSchema
>;
