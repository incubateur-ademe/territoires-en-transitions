import {TIndicateurDefinition} from '../types';
import {TIndicateurValeur} from '../useIndicateurValeurs';

export type TIndicateurChartProps = {
  definition: TIndicateurDefinition;
  /** affichage par défaut (dans la grille) ou zoomé (téléchargeable) */
  variant?: 'default' | 'zoomed';
  className?: string;
};

export type TIndicateurChartBaseProps = TIndicateurChartProps & {
  valeurs: TIndicateurValeur[];
};
