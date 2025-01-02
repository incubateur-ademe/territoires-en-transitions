import { z } from 'zod';

export const deleteIndicateursValeursResponseSchema = z
  .object({
    indicateurValeurIdsSupprimes: z.array(z.number().int()),
  })
  .describe('Identifiant des valeurs supprimées');

export type DeleteIndicateursValeursResponseType = z.infer<
  typeof deleteIndicateursValeursResponseSchema
>;
