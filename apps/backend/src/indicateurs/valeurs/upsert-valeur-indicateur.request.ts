import { indicateurValeurSchemaCreate } from '@/domain/indicateurs';
import * as z from 'zod/mini';

/** Upsert d'une valeur d'indicateur pour une collectivité */
export const upsertValeurIndicateurSchema = z.object({
  ...z.pick(indicateurValeurSchemaCreate, {
    collectiviteId: true,
    indicateurId: true,
    id: true,
    resultat: true,
    resultatCommentaire: true,
    objectif: true,
    objectifCommentaire: true,
  }).shape,

  dateValeur: z.optional(indicateurValeurSchemaCreate.shape.dateValeur),
});

export type UpsertValeurIndicateur = z.infer<
  typeof upsertValeurIndicateurSchema
>;
