import { z } from 'zod';

export const listIndicateurResponseSchema = z.object({
  id: z.number(),
  titre: z.string(),
  estPerso: z.boolean(),
  identifiant: z.string().nullable(),
  hasOpenData: z.boolean(),
});

export type ListIndicateurResponse = z.infer<
  typeof listIndicateurResponseSchema
>;
