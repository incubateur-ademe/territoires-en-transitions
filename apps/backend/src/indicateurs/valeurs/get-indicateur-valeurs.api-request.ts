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
      .transform((value) => value.split(',').map(Number))
      .optional()
      .describe('Identifiants des indicateurs (séparés par des virgules)'),

    identifiantsReferentiel: z
      .string()
      .transform((value) => value.split(','))
      .pipe(z.string().array())
      .optional()
      .describe(
        'Identifiants du référentiel si préféré aux identifiants numériques (séparés par des virgules)'
      ),
    sources: z
      .string()
      .transform((value) => value.split(','))
      .pipe(z.string().array())
      .optional()
      .describe(
        'Liste des sources (séparées par des virgules). Mot clé `collectivite` pour les valeurs renseignées par la collectivité'
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
