import {
  indicateurValeurSchemaInsert,
  sourceMetadonneeSchema,
} from '@/domain/indicateurs';
import { z } from 'zod';

/**
 * Schéma zod d'une valeur d'indicateur
 */
export const valeurSchema = indicateurValeurSchemaInsert
  .omit({
    dateValeur: true,
  })
  .extend({
    annee: z.number(),
    source: sourceMetadonneeSchema.optional().nullable(),
  });

/**
 * Type TS d'une valeur d'indicateur
 */
export type Valeur = z.input<typeof valeurSchema>;

/**
 * Schéma zod d'une ligne de comparaison entre les valeurs utilisateurs et source
 */
export const valeurComparaisonLigneSchema = z.object({
  conflit: z.boolean(),
  annee: z.number(),
  idAEcraser: z.number().nullable(),
  idAAppliquer: z.number(),
  valeurAEcraser: z.number().nullable(),
  valeurAAppliquer: z.number(),
  source: z.string(),
});

/**
 * Type TS d'une ligne de comparaison entre les valeurs utilisateurs et source
 */
export type ValeurComparaisonLigne = z.input<
  typeof valeurComparaisonLigneSchema
>;

/**
 * Schéma zod pour la comparaison des valeurs utilisateurs avec les valeurs d'une source
 */
export const valeurComparaisonSchema = z.object({
  lignes: valeurComparaisonLigneSchema.array(),
  conflits: z.number(),
  ajouts: z.number(),
});

/**
 * Type TS pour la comparaison des valeurs utilisateurs avec les valeurs d'une source
 */
export type ValeurComparaison = z.input<typeof valeurComparaisonSchema>;
