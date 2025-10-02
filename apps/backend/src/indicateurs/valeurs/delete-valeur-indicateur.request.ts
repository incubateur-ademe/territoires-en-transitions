import { z } from 'zod';

/** Suppression d'une valeur d'indicateur pour une collectivité */
export const deleteValeurIndicateurSchema = z.object({
  collectiviteId: z.number(),
  indicateurId: z.number(),
  id: z.number(),
});

export type DeleteValeurIndicateur = z.infer<
  typeof deleteValeurIndicateurSchema
>;
