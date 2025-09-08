import { z } from 'zod';
import { indicateurValeurSchemaInsert } from './indicateur-valeur.table';

/** Upsert d'une valeur d'indicateur pour une collectivité */
export const upsertValeurIndicateurSchema = indicateurValeurSchemaInsert
  .pick({
    collectiviteId: true,
    indicateurId: true,
    id: true,
    resultat: true,
    resultatCommentaire: true,
    objectif: true,
    objectifCommentaire: true,
  })
  .extend({
    dateValeur: indicateurValeurSchemaInsert.shape.dateValeur.optional(),
  });

export type UpsertValeurIndicateur = z.infer<
  typeof upsertValeurIndicateurSchema
>;
