import {LineProps} from '@nivo/line';
import {theme} from 'ui/charts/chartsTheme';
import {ANNEE_REFERENCE, ANNEE_JALON2} from '../constants';

// couleurs et libellés pour les graphes
export const COULEURS_SECTEUR = [
  '#FEF1D8',
  '#F7B1C2',
  '#A4E7C7',
  '#D8EEFE',
  '#B8D6F7',
  '#FFD0BB',
  '#FBE7B5',
  '#E4CDEE',
  '#C6C3E3',
  '#D9D9D9',
];

export const LAYERS = {
  objectifs: {color: '#F5895B', label: 'Mes objectifs'},
  resultats: {color: '#6A6AF4', label: 'Mes résultats'},
  trajectoire: {color: '#1E98C6', label: 'SNBC territorialisée'},
};

// pour formater les chiffres
const NumFormat = Intl.NumberFormat('fr', {maximumFractionDigits: 3});

// Propriétés communes aux graphes de Trajectoire
export const COMMON_CHART_PROPS: Partial<LineProps> = {
  colors: {datum: 'color'},
  theme,
  margin: {top: 5, right: 5, bottom: 55, left: 50},
  xScale: {
    type: 'time',
    precision: 'year',
    format: '%Y',
    max: `${ANNEE_JALON2 + 1}`,
  },
  yScale: {
    type: 'linear',
    min: 'auto',
    max: 'auto',
    stacked: true,
  },
  yFormat: value => NumFormat.format(value as number),
  axisBottom: {
    format: '%Y',
    legendPosition: 'end',
    tickSize: 5,
    tickPadding: 15,
    tickRotation: -35,
    tickValues: ANNEE_JALON2 - ANNEE_REFERENCE,
  },
  axisLeft: {
    format: value => NumFormat.format(value as number),
  },
  gridXValues: ANNEE_JALON2 - ANNEE_REFERENCE,
  enableArea: true,
  areaOpacity: 0.8,
  enablePoints: false,
  lineWidth: 0,
  curve: 'natural',
  enableSlices: 'x',
} as const;
