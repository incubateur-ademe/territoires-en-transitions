import { scoreIndicatifTypeEnumSchema } from '@/domain/referentiels';
import z from 'zod';

export const setValeursUtiliseesRequestSchema = z.object({
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

export type SetValeursUtiliseesRequest = z.infer<
  typeof setValeursUtiliseesRequestSchema
>;
