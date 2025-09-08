import { categorieTagSchema } from '@/domain/collectivites';
import { thematiqueSchema } from '@/domain/shared';
import { z } from 'zod';
import { actionSchema } from '../../referentiel/domain/action.schema';

/**
 * Schéma zod de la définition d'un indicateur
 */
const definitionSchema = z.object({
  id: z.number(),
  groupementId: z.number().nullish(),
  collectiviteId: z.number().nullish(), // perso
  identifiant: z.string().nullish(),
  titre: z.string(),
  titreLong: z.string().nullish(),
  description: z.string().nullish(),
  unite: z.string(),
  borneMin: z.number().nullish(),
  borneMax: z.number().nullish(),
  participationScore: z.boolean(),
  sansValeur: z.boolean(),
  commentaire: z.string().nullish(),
  confidentiel: z.boolean(),
  rempli: z.boolean(),
  estPerso: z.boolean(),
  actions: actionSchema.array(),
  type: categorieTagSchema,
  programmes: categorieTagSchema.array().nullish(),
  prioritaire: z.boolean(),
  thematiques: thematiqueSchema.array().nullish(),
  enfants: z.number().array().nullish(),
  parents: z.number().array().nullish(),
  hasOpenData: z.boolean().nullish(),
  modifiedAt: z.string().datetime().nullish(),
});

/**
 * Schéma zod d'un élément d'une liste d'indicateurs
 */
export const indicateurListItemSchema = definitionSchema.pick({
  id: true,
  titre: true,
  estPerso: true,
  identifiant: true,
  hasOpenData: true,
});

/**
 * Type TS d'un élément d'une liste d'indicateurs
 */
export type IndicateurListItem = z.input<typeof indicateurListItemSchema>;

/**
 * Schéma zod d'un indicateur pour un affichage en graphique
 */
export const indicateurChartInfoSchema = indicateurListItemSchema.extend({
  titreLong: z.string().nullable(),
  unite: z.string(),
  rempli: z.boolean(),
  confidentiel: z.boolean(),
  favoriCollectivite: z.boolean(),
  participationScore: z.boolean(),
  sansValeur: z.boolean().nullable(),
  enfants: z
    .object({
      id: z.number(),
      rempli: z.boolean(),
    })
    .array()
    .nullable(),
  count: z.number().nullable(),
  total: z.number().nullable(),
  valeurs: z
    .object({
      annee: z.number(),
      resultat: z.number(),
      objectif: z.number(),
    })
    .array()
    .nullable(),
});

/**
 * Type TS d'un indicateur pour un affichage en graphique
 */
export type IndicateurChartInfo = z.input<typeof indicateurChartInfoSchema>;
