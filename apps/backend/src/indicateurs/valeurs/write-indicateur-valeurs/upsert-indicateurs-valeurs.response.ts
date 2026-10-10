import { indicateurValeurSchema } from '@tet/domain/indicateurs';
import { z } from 'zod';

export const upsertIndicateursValeursResponseSchema = z
  .object({
    valeurs: z
      .array(indicateurValeurSchema)
      .min(1)
      .describe('Liste de valeurs'),
  })
  .describe('Valeurs insérées ou mises à jour');
export type UpsertIndicateursValeursResponse = z.infer<
  typeof upsertIndicateursValeursResponseSchema
>;
