import { preset } from '@/ui';

const colorTheme = preset.theme.extend.colors;

export const theme = {
  fontFamily: '"Marianne", arial, sans-serif',
  fontSize: 12,
  textColor: colorTheme.primary[9],
  axis: {
    legend: {
      text: {
        fontFamily: '"Marianne", arial, sans-serif',
        fontSize: 14,
      },
    },
    ticks: {
      text: {
        fontWeight: 'bolder',
      },
    },
  },
  legends: {
    text: {
      fontSize: 12,
      fontWeight: 'bolder',
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
