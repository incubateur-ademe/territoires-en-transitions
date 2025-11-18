import {
  IndicateurValeurType,
  IndicateurValeurTypeEnum,
  IndicateurValeurWithoutReferenceType,
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
  [COLLECTIVITE_SOURCE_ID]: {
    [IndicateurValeurTypeEnum.RESULTAT]: { color: '#6A6AF4' },
    [IndicateurValeurTypeEnum.OBJECTIF]: { color: '#F5895B' },
  },
  snbc: {
    [IndicateurValeurTypeEnum.OBJECTIF]: { color: '#1E98C6' },
  },
};

export type ChartSurfaceStyle = ChartLineStyle &
  Pick<LineSeriesOption, 'areaStyle' | 'itemStyle'>;

export const DEFAULT_CHART_SURFACE_STYLE: ChartSurfaceStyle = {
  smooth: true,
  symbol: 'none',
  color: '#91B2EE',
  areaStyle: {},
  lineStyle: {
    width: 0,
  },
};

const DOTTED_AREA: LineSeriesOption['itemStyle'] = {
  decal: {
    symbol: 'circle',
    symbolSize: 0.3,
    dashArrayX: [
      [18, 18],
      [0, 18, 18, 0],
    ],
    dashArrayY: [9, 0],
  },
};

export const DEFAULT_CHART_SURFACE_STYLES_BY_VALEUR_TYPE: {
  [valeurType in IndicateurValeurWithoutReferenceType]: ChartSurfaceStyle;
} = {
  [IndicateurValeurTypeEnum.RESULTAT]: {},
  [IndicateurValeurTypeEnum.OBJECTIF]: {
    itemStyle: DOTTED_AREA,
  },
};
