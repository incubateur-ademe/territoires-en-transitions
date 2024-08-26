import {LineProps} from '@nivo/line';
import {theme} from 'ui/charts/chartsTheme';

// couleurs et libellés pour les graphes
export const COULEURS_SECTEUR = [
  '#FEF1D8',
  '#F7B1C2',
  '#A4E7C7',
  '#D8EEFE',
  '#B8D6F7',
  '#FFD0BB',
  '#FBE7B5',
  '#D9D9D9',
  '#A3DE00',
];

export const COULEURS_SOUS_SECTEUR = ['#6A6AF4', '#F4C447', '#E1E1FD'];

export const LAYERS = {
  objectifs: {color: '#F5895B', label: 'Mes objectifs'},
  resultats: {color: '#6A6AF4', label: 'Mes résultats'},
  trajectoire: {color: '#1E98C6', label: 'SNBC territorialisée'},
};

// années de début/fin de la SNBC v2
export const ANNEE_REFERENCE = 2015;
//const ANNEE_JALON1 = 2030;
export const ANNEE_JALON2 = 2050;

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
    min: 0,
    max: 'auto',
    stacked: true,
  },
  yFormat: ' >-.2f',
  axisBottom: {
    format: '%Y',
    legendPosition: 'end',
    tickSize: 5,
    tickPadding: 15,
    tickRotation: -35,
    tickValues: ANNEE_JALON2 - ANNEE_REFERENCE,
  },
  gridXValues: ANNEE_JALON2 - ANNEE_REFERENCE,
  enableArea: true,
  areaOpacity: 0.8,
  enablePoints: false,
  lineWidth: 0,
  curve: 'natural',
  enableSlices: 'x',
} as const;
