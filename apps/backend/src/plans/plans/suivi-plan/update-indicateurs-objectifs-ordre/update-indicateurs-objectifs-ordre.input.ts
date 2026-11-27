import { z } from 'zod';

export const updateIndicateursObjectifsOrdreInputSchema = z.object({
  planId: z.number().int().positive(),
  // l'ordre d'affichage voulu, de haut en bas
  indicateurIds: z.array(z.number().int().positive()).max(500),
});

export type UpdateIndicateursObjectifsOrdreInput = z.infer<
  typeof updateIndicateursObjectifsOrdreInputSchema
>;
