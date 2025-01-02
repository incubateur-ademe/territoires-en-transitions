import { z } from 'zod';

export const getIndicateursValeursRequestSchema = z
  .object({
    collectiviteId: z.coerce
      .number()
      .int()
      .describe('Identifiant de la collectivité'),
    indicateurIds: z.coerce
      .number()
      .int()
      .array()
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
    ignoreDedoublonnage: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional()
      .describe('Ignore le dédoublonnage'),
    withoutDefinition: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional()
      .describe("Exclue les définitions d'indicateur de la réponse"),
  })
  .describe('Filtre de récupération des valeurs des indicateurs');

export type GetIndicateursValeursRequestType = z.infer<
  typeof getIndicateursValeursRequestSchema
>;
