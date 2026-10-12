import {
  IndicateurDefinition,
  IndicateurPeriod,
  IndicateurValeur,
  IndicateurValeurType,
} from '@tet/domain/indicateurs';

import type { ReactNode } from 'react';

export type PcaetIndicateurValeurType = Extract<
  IndicateurValeurType,
  'resultat' | 'objectif'
>;

export type IndicateurPeriodColumn = {
  period: IndicateurPeriod | null;
  valeurTypes: readonly PcaetIndicateurValeurType[];
  renderHeader: (colSpan: number) => ReactNode;
};

export type IndicateurTableRow = {
  indicateurId: number;
  indicateurLabel: string;
  indicateurDefinition: IndicateurDefinition;
  indicateurValeurs: IndicateurValeur[];
  /** Règle métier fournie par le contexte qui construit la grille. */
  isValeurRequired: (period: IndicateurPeriod | null) => boolean;
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
