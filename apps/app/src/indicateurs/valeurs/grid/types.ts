import {
  IndicateurDefinition,
  IndicateurValeur,
  IndicateurValeurType,
} from '@tet/domain/indicateurs';

/**
 * Colonne d’année de référence tant que la collectivité n’a pas saisi l’année.
 * Ce n’est pas une année civile : les cellules de cette colonne ne se
 * persistent pas.
 */
export const UNSET_REFERENCE_YEAR = 0;
export const isUnsetReferenceYear = (year: number): boolean =>
  year === UNSET_REFERENCE_YEAR;

export type PcaetIndicateurValeurType = Extract<
  IndicateurValeurType,
  'resultat' | 'objectif'
>;

export type IndicateurTableRow = {
  indicateurId: number;
  indicateurLabel: string;
  indicateurDefinition: IndicateurDefinition;
  indicateurValeurs: IndicateurValeur[];
  /** Années dont la valeur peut rester vide pour cette ligne. */
  optionalYears?: readonly number[] | 'all';
};

/**
 * Plafond de hauteur de la grille, qui décide aussi de la zone de défilement
 * dans laquelle l'en-tête et les lignes de secteur restent collantes.
 * `none` supprime le plafond : plus de défilement vertical interne, donc plus
 * d'en-tête collant.
 */
export type GridMaxHeight = 'compact' | 'viewport' | 'none';
