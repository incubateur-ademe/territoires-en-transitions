import {Theme} from '@nivo/core';

export const theme: Theme = {
  fontFamily: '"Marianne", arial, sans-serif',
  fontSize: 12,
  axis: {
    legend: {
      text: {
        fontFamily: '"Marianne", arial, sans-serif',
        fontSize: 14,
      },
    },
  },
  legends: {
    text: {
      fontSize: 12,
    },
  },
  tooltip: {
    container: {
      fontSize: 14,
      background: '#fff',
      padding: '9px 12px',
      border: '1px solid #ccc',
    },
  },
  labels: {
    text: {
      fontFamily: '"Marianne", arial, sans-serif',
    },
  },
};

export const defaultColors = [
  '#21AB8E',
  '#FFCA00',
  '#FF732C',
  '#34BAB5',
  '#FFB7AE',
];

export const nivoColorsSet = [
  '#8dd3c7',
  '#ffffb3',
  '#bebada',
  '#fb8072',
  '#80b1d3',
  '#fdb462',
  '#b3de69',
  '#fccde5',
  '#d9d9d9',
  '#bc80bd',
  '#ccebc5',
  '#ffed6f',
];

export const enum StatusColor {
  'Abandonné' = '#F95C5E',
  'En pause' = '#FF9575',
  'À venir' = '#7AB1E8',
  'En cours' = '#869ECE',
  'Réalisé' = '#34CB6A',
  'NC' = '#CCC',
  'Sans statut' = '#CCC',
}

export const enum ActionStatusColor {
  'Fait' = '#34CB6A',
  'Détaillé' = '#CE70CC',
  'Programmé' = '#7AB1E8',
  'Pas fait' = '#F95C5E',
  'Non renseigné' = '#E5E5E5',
  'Non concerné' = '#929292',
}
