import z from 'zod';
import { typeScoreIndicatif } from '../models/type-score-indicatif.enum';

export const setValeursUtiliseesRequestSchema = z.object({
  actionId: z.string(),
  collectiviteId: z.number(),
  indicateurId: z.number(),
  valeurs: z
    .object({
      indicateurValeurId: z.number().nullable(),
      typeScore: z.enum(typeScoreIndicatif),
    })
    .array(),
});

export type SetValeursUtiliseesRequest = z.infer<
  typeof setValeursUtiliseesRequestSchema
>;
