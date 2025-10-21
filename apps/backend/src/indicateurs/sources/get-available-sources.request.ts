import { z } from 'zod';

export const getAvailableSourcesRequestSchema = z
  .object({
    collectiviteId: z.int().describe('Identifiant de la collectivité'),
    indicateurId: z.int().describe("Identifiant de l'indicateur"),
  })
  .describe('Sources disponibles pour un indicateur');

export type GetAvailableSourcesRequestSchemaRequestType = z.infer<
  typeof getAvailableSourcesRequestSchema
>;
