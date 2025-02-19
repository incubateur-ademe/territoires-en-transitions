import { z } from 'zod';

export const getAvailableSourcesRequestSchema = z
  .object({
    collectiviteId: z.coerce
      .number()
      .int()
      .describe('Identifiant de la collectivité'),
    indicateurId: z.coerce
      .number()
      .int()
      .describe("Identifiant de l'indicateur"),
  })
  .describe('Sources disponibles pour un indicateur');

export type GetAvailableSourcesRequestSchemaRequestType = z.infer<
  typeof getAvailableSourcesRequestSchema
>;
