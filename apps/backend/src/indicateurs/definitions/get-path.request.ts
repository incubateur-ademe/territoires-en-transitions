import { z } from 'zod';

export const getPathRequestSchema = z
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
  .describe("Donne le chemin d'un indicateur");

export type GetPathRequest = z.infer<typeof getPathRequestSchema>;
