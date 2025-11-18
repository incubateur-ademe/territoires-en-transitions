import { createEnumObject } from '@tet/domain/utils';

/**
 * Les cibles/seuils sont des valeurs de référence réglementaires associées à la définition d'un indicateur.
 * Les objectifs sont des valeurs propres à chaque collectivité (soit saisies manuellement, soit calculées comme dans le cas de la trajectoire SNBC)
 * Mais la nuance entre cible et objectif peut être vue comme étant subtile: une cible peut être vue comme un objectif provenant de l'ademe
 * TODO: à clarifier avec les PO
 */

export const IndicateurValeurWithoutReferenceTypes = [
  'resultat',
  'objectif',
] as const;

export const IndicateurValeurTypes = [
  ...IndicateurValeurWithoutReferenceTypes,
  'cible',
  'seuil',
  'moyenne',
] as const;

export const IndicateurValeurTypeEnum = createEnumObject(IndicateurValeurTypes);

export type IndicateurValeurType = (typeof IndicateurValeurTypes)[number];

export type IndicateurValeurWithoutReferenceType =
  (typeof IndicateurValeurWithoutReferenceTypes)[number];

export const INDICATEUR_VALEUR_TYPE_LABEL: Record<
  IndicateurValeurType,
  string
> = {
  objectif: 'Objectifs',
  resultat: 'Résultats',
  cible: 'Valeur cible',
  seuil: 'Valeur limite',
  moyenne: 'Moyenne des collectivités de même type',
};
