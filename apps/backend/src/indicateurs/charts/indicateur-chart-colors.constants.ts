import {
  IndicateurValeurType,
  IndicateurValeurTypeEnum,
} from '@tet/domain/indicateurs';
import { LineSeriesOption } from 'echarts/types/dist/echarts';
import { COLLECTIVITE_SOURCE_ID } from '../valeurs/valeurs.constants';

export type ChartLineStyle = Pick<
  LineSeriesOption,
  'color' | 'smooth' | 'symbol' | 'symbolSize' | 'lineStyle' | 'showSymbol'
>;

export const DEFAULT_CHART_LINE_STYLE: ChartLineStyle = {
  smooth: true,
  symbol: 'circle',
  color: '#91B2EE',
};

export const DEFAULT_CHART_LINE_STYLES_BY_VALEUR_TYPE: {
  [valeurType in IndicateurValeurType]: ChartLineStyle;
} = {
  [IndicateurValeurTypeEnum.RESULTAT]: {
    symbolSize: 8,
    lineStyle: {
      width: 2,
    },
  },
  [IndicateurValeurTypeEnum.OBJECTIF]: {
    symbolSize: 4,
    lineStyle: {
      width: 2,
      type: 'dashed',
    },
  },
  [IndicateurValeurTypeEnum.CIBLE]: {
    color: '#48A775',
    lineStyle: {
      width: 2,
      type: 'dotted',
    },
  },
  [IndicateurValeurTypeEnum.SEUIL]: {
    symbol: 'none',
    color: '#EB633E',
    lineStyle: {
      width: 2,
      type: 'dotted',
    },
  },
  [IndicateurValeurTypeEnum.MOYENNE]: {
    color: '#41E6FF',
  },
};

/**
 * TODO: to be shared with app
 */
export const INDICATEUR_CHART_LINE_STYLES_BY_SOURCE_ID: {
  [sourceId: string]: {
    [valeurType in IndicateurValeurType]?: ChartLineStyle;
  };
} = {
  moyenne: { [IndicateurValeurTypeEnum.RESULTAT]: { color: '#41E6FF' } },
  [COLLECTIVITE_SOURCE_ID]: {
    [IndicateurValeurTypeEnum.RESULTAT]: { color: '#6A6AF4' },
    [IndicateurValeurTypeEnum.OBJECTIF]: { color: '#F5895B' },
  },
  snbc: {
    [IndicateurValeurTypeEnum.OBJECTIF]: { color: '#1E98C6' },
  },
  /*
  cible: { color: '#48A775' },
  seuil: { color: '#EB633E' },
  objectifs: { color: '#F5895B', label: 'Objectifs de la collectivité' },
  resultats: { color: '#6A6AF4', label: 'Résultats de la collectivité' },
  trajectoire: { color: '#1E98C6', label: 'Objectifs SNBC territorialisée' },*/
};
