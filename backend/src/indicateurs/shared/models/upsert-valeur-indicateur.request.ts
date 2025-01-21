import { z } from 'zod';
import { indicateurValeurSchemaInsert } from './indicateur-valeur.table';

/** Upsert d'une valeur d'indicateur pour une collectivité */
const shape = indicateurValeurSchemaInsert.shape;
const upsertValeurIndicateurSchema = indicateurValeurSchemaInsert
  .pick({
    collectiviteId: true,
    indicateurId: true,
  })
  .merge(
    z.object({
      id: shape.id.optional(), // pour un update
      dateValeur: shape.dateValeur.optional(), // pour un insert
      resultat: shape.resultat.nullish(),
      resultatCommentaire: shape.resultatCommentaire.nullish(),
      objectif: shape.objectif.nullish(),
      objectifCommentaire: shape.objectifCommentaire.nullish(),
    })
  );

export type UpsertValeurIndicateur = z.infer<
  typeof upsertValeurIndicateurSchema
>;
