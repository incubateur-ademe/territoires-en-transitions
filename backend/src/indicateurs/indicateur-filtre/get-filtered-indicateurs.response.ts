import { z } from 'zod';

export const getFilteredIndicateurResponseSchema = z.object({
  id: z.number(),
  titre: z.string(),
  estPerso: z.boolean(),
  identifiant: z.string().nullable(),
  hasOpenData: z.boolean(),
});

export type GetFilteredIndicateurResponseType = z.infer<
  typeof getFilteredIndicateurResponseSchema
>;
