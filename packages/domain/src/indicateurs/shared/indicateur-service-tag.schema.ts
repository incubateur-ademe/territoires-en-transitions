import * as z from 'zod/mini';

export const indicateurServiceTagSchema = z.object({
  indicateurId: z.number(),
  serviceTagId: z.number(),
  collectiviteId: z.number(),
});

export type IndicateurServiceTag = z.infer<typeof indicateurServiceTagSchema>;

