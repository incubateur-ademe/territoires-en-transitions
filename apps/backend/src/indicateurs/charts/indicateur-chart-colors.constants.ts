import { LineSeriesOption } from 'echarts/types/dist/echarts';
import {
  IndicateurValeurEnum,
  IndicateurValeurType,
} from '../shared/models/indicateur-valeur-type.enum';
import { COLLECTIVITE_SOURCE_ID } from '../valeurs/valeurs.constants';

export type ChartLineStype = Pick<
  LineSeriesOption,
  'color' | 'smooth' | 'symbol' | 'symbolSize' | 'lineStyle'
>;

export const DEFAULT_CHART_LINE_STYLE: ChartLineStype = {
  color: '#6A6AF4',
  smooth: true,
  symbol: 'circle',
  symbolSize: 8,
  lineStyle: {
    width: 2,
  },
};

/**
 * TODO: to be shared with app
 */
export const INDICATEUR_CHART_COLORS: {
  [sourceId: string]: {
    [valeurType in IndicateurValeurType]?: ChartLineStype;
  };
} = {
  moyenne: { [IndicateurValeurEnum.RESULTAT]: { color: '#41E6FF' } },
  [COLLECTIVITE_SOURCE_ID]: {
    [IndicateurValeurEnum.RESULTAT]: { color: '#6A6AF4' },
    [IndicateurValeurEnum.OBJECTIF]: { color: '#F5895B' },
  },
  snbc: {
    [IndicateurValeurEnum.OBJECTIF]: { color: '#1E98C6' },
  },
  /*
  cible: { color: '#48A775' },
  seuil: { color: '#EB633E' },
  objectifs: { color: '#F5895B', label: 'Objectifs de la collectivité' },
  resultats: { color: '#6A6AF4', label: 'Résultats de la collectivité' },
  trajectoire: { color: '#1E98C6', label: 'Objectifs SNBC territorialisée' },*/
};
