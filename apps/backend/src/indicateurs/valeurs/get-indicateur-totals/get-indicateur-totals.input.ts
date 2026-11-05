import { z } from 'zod';

export const getIndicateurTotalsInputSchema = z
  .object({
    collectiviteId: z.int().describe('Identifiant de la collectivité'),
    indicateurId: z
      .int()
      .positive()
      .describe("Identifiant de l'indicateur parent"),
  })
  .describe("Totaux des sous-indicateurs d'un indicateur parent");

export type GetIndicateurTotalsInput = z.infer<
  typeof getIndicateurTotalsInputSchema
>;
