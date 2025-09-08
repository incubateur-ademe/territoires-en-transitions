import { z } from 'zod';

export const getFavorisCountRequestSchema = z
  .object({
    collectiviteId: z.coerce
      .number()
      .int()
      .describe('Identifiant de la collectivité'),
  })
  .describe("Donne le nombre d'indicateurs favoris");

export type GetFavorisCountRequest = z.infer<
  typeof getFavorisCountRequestSchema
>;
