import { z } from 'zod';

/** Upsert d'une valeur d'indicateur pour une collectivité */
export const upsertValeurIndicateurSchema = z.object({
  collectiviteId: z.number(),
  indicateurId: z.number(),
  id: z.number().optional(), // pour un update
  dateValeur: z.string().optional(), // pour un insert
  resultat: z.number().nullish(),
  resultatCommentaire: z.string().nullish(),
  objectif: z.number().nullish(),
  objectifCommentaire: z.string().nullish(),
});

export type UpsertValeurIndicateur = z.infer<
  typeof upsertValeurIndicateurSchema
>;
