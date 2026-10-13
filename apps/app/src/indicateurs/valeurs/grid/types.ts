import {
  IndicateurDefinition,
  IndicateurPeriode,
  IndicateurValeur,
  IndicateurValeurType,
} from '@tet/domain/indicateurs';

import type { ReactNode } from 'react';

export type IndicateurValeurField = Extract<
  IndicateurValeurType,
  'resultat' | 'objectif'
>;

export type IndicateurPeriodeColumn = {
  periode: IndicateurPeriode | null;
  valeurTypes: readonly IndicateurValeurField[];
  renderHeader: (colSpan: number) => ReactNode;
};

export type IndicateurTableRow = {
  indicateurId: number;
  indicateurLabel: string;
  indicateurDefinition: IndicateurDefinition;
  indicateurValeurs: IndicateurValeur[];
  /** Règle métier fournie par le contexte qui construit la grille. */
  isValeurRequired: (periode: IndicateurPeriode | null) => boolean;
  /**
   * `false` quand la collectivité a déclaré l'indicateur non applicable : la
   * ligne n'est plus saisissable et cesse d'être réclamée.
   */
  isApplicable: boolean;
};

/**
 * Plafond de hauteur de la grille, qui décide aussi de la zone de défilement
 * dans laquelle l'en-tête et les lignes de secteur restent collantes.
 * `none` supprime le plafond : plus de défilement vertical interne, donc plus
 * d'en-tête collant.
 */
export type GridMaxHeight = 'compact' | 'viewport' | 'none';
