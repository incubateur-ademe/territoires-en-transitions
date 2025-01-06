import { z } from 'zod';

export const donneesARemplirValeurSchema = z.object({
  identifiantsReferentiel: z.array(z.string()),
  valeur: z.number().nullable(),
  dateMin: z.string().nullable(),
  dateMax: z.string().nullable(),
});
export type DonneesARemplirValeurType = z.infer<
  typeof donneesARemplirValeurSchema
>;
