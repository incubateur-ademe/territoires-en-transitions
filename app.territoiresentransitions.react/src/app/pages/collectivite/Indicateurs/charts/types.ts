import {TIndicateurChartInfo, TIndicateurListItem} from '../types';
import {TIndicateurValeur} from '../useIndicateurValeurs';

export type TIndicateurChartProps = {
  definition: TIndicateurListItem;
  /** affichage par défaut (dans la grille) ou zoomé (téléchargeable) */
  variant?: 'default' | 'zoomed';
  /** nom de la source de données (pour les données importées des indicateurs prédéfinis) */
  importSource?: string;
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
