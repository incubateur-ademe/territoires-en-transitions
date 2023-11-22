import {TIndicateurChartInfo, TIndicateurListItem} from '../types';
import {TIndicateurValeur} from '../useIndicateurValeurs';

export type TIndicateurChartProps = {
  definition: TIndicateurListItem;
  /** affichage par défaut (dans la grille) ou zoomé (téléchargeable) */
  variant?: 'default' | 'zoomed';
  className?: string;
};

export type TIndicateurChartBaseProps = Pick<
  TIndicateurChartProps,
  'variant' | 'className'
> & {
  definition: TIndicateurChartInfo & {
    id: string | number;
    titre_long?: string;
  };
  valeurs: TIndicateurValeur[];
};
