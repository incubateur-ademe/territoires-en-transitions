import {
  indicateurSourceMetadonneeSchema,
  indicateurValeurSchemaCreate,
} from '@/domain/indicateurs';
import { z } from 'zod/mini';

/**
 * Schéma zod d'une valeur d'indicateur
 */
export const valeurSchema = z.object({
  ...z.omit(indicateurValeurSchemaCreate, {
    dateValeur: true,
  }).shape,

  annee: z.number(),
  source: z.nullish(indicateurSourceMetadonneeSchema),
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
  idAEcraser: z.nullable(z.number()),
  idAAppliquer: z.number(),
  valeurAEcraser: z.nullable(z.number()),
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
  lignes: z.array(valeurComparaisonLigneSchema),
  conflits: z.number(),
  ajouts: z.number(),
});

/**
 * Type TS pour la comparaison des valeurs utilisateurs avec les valeurs d'une source
 */
export type ValeurComparaison = z.input<typeof valeurComparaisonSchema>;
