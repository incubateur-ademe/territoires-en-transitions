import { scoreIndicatifTypeEnumSchema } from '@tet/domain/referentiels';
import z from 'zod';

export const setScoreFromIndicateurInputSchema = z.object({
  actionId: z.string(),
  collectiviteId: z.number(),
  indicateurId: z.number(),
  valeurs: z
    .object({
      indicateurValeurId: z.number().nullable(),
      typeScore: scoreIndicatifTypeEnumSchema,
    })
    .array(),
});

export type SetScoreFromIndicateurInput = z.infer<
  typeof setScoreFromIndicateurInputSchema
>;
