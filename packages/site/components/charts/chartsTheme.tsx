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
      fontSize: 14,
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
      fontWeight: 'bold',
      color: '#2A2A62',
    },
  },
};

export const defaultColors = [
  '#3F007D',
  '#54278F',
  '#6A51A3',
  '#807DBA',
  '#9E9AC8',
  '#BCBDDC',
  '#DADAEB',
  '#EFEDF5',
];

export const statsColors = [
  '#21AB8E',
  '#FFCA00',
  '#FF732C',
  '#FFB7AE',
  '#34BAB5',
];
