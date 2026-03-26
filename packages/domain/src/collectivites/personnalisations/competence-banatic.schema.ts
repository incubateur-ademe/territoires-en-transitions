import * as z from 'zod/mini';

export const competenceBanaticSchema = z.object({
  competenceCode: z.number(),
  intitule: z.string(),
  version: z.string(),
});

export type CompetenceBanatic = z.infer<typeof competenceBanaticSchema>;
