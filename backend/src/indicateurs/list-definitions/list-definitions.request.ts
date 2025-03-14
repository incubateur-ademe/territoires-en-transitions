import { z } from 'zod';

export const listDefinitionsRequestSchema = z
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
      .describe("Identifiants de l'indicateur"),
    identifiantsReferentiel: z
      .string()
      .array()
      .optional()
      .describe('Identifiants du référentiel'),
  })
  .describe('Filtre de récupération des définitions des indicateurs');

export type ListDefinitionsRequest = z.infer<
  typeof listDefinitionsRequestSchema
>;
