import * as z from 'zod/mini';

export const indicateurObjectifSchema = z.object({
  indicateurId: z.number(),
  dateValeur: z.string(),
  formule: z.string(),
});

export type IndicateurObjectif = z.infer<typeof indicateurObjectifSchema>;

