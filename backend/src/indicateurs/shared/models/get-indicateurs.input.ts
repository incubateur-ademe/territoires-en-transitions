import { z } from 'zod';

export const getIndicateursValeursInputSchema = z
  .object({
    collectiviteId: z
      .number()
      .int()
      .optional()
      .describe('Identifiant de la collectivité'),
    indicateurIds: z
      .number()
      .int()
      .array()
      .optional()
      .describe("Identifiant de l'indicateur"),
    identifiantsReferentiel: z
      .string()
      .array()
      .optional()
      .describe('Identifiants du référentiel'),
    sources: z
      .string()
      .array()
      .optional()
      .describe(
        'Liste des sources. `collectivite` pour les valeurs renseignées par la collectivité'
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

export type GetIndicateursValeursInputType = z.infer<
  typeof getIndicateursValeursInputSchema
>;
