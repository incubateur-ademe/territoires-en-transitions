import { ficheResumeSchema } from '@tet/api/plan-actions';
import { personneSchema, tagSchema } from '@tet/api/shared/domain';
import { z } from 'zod';
import { definitionSchema } from './definition.schema';
import { valeurSchema } from './valeur.schema';

/**
 * Schéma zod à fusionner à une définition pour avoir les valeurs
 */
const plusValeur = z.object({
  valeurs: valeurSchema.array(),
});

/**
 * Schéma zod à fusionner à une définition pour avoir les données annexes aux indicateurs
 */
const plusDetailsCollectivite = z.object({
  services: z.number().array(), // Lise d'id
  pilotes: personneSchema.array(),
  fiches: ficheResumeSchema.array(),
  fichesNonClassees: ficheResumeSchema.array(),
  categoriesUtilisateur: tagSchema.array(),
});

/**
 * Schéma zod d'un indicateur avec toutes les informations annexes liées
 */
export const definitionCompleteSchema = definitionSchema
  .merge(plusValeur)
  .merge(plusDetailsCollectivite);
/**
 * Type TS d'un indicateur avec toutes les informations annexes liées
 */
export type IndicateurDefinitionComplet = z.input<
  typeof definitionCompleteSchema
>;
