/**
 * Thème partagé par tous les graphiques
 *
 * Surcharge les valeurs par défaut définies dans :
 * https://github.com/plouc/nivo/blob/master/packages/core/src/theming/defaultTheme.js
 */
import { Theme } from '@nivo/core';
import { AxisProps } from '@nivo/axes';
import { LegendProps } from '@nivo/legends';

export const colors = ['#21AB8E', '#FFCA00', '#FF732C', '#FFB7AE', '#34BAB5'];
const fontFamily = '"Marianne", arial, sans-serif';

export const fromMonth = '2022-01-01';

export const theme: Theme = {
  fontFamily,
  fontSize: 12,
  axis: {
    legend: {
      text: {
        fontSize: 14,
      },
    },
  },
  tooltip: {
    container: {
      fontSize: 14,
      background: 'white',
      padding: '9px 12px',
      border: '1px solid #ccc',
    },
  },
};

export const dateAsMonthAndYear = (v: string) =>
  new Date(v).toLocaleDateString('fr', {
    month: 'short',
    year: 'numeric',
  });

export const axisBottomAsDate: AxisProps = {
  legendPosition: 'end',
  tickSize: 5,
  tickPadding: 12,
  tickRotation: -35,
  format: dateAsMonthAndYear,
};

export const axisLeftMiddleLabel = (legend: string): AxisProps => ({
  tickSize: 4,
  tickPadding: 5,
  tickRotation: 0,
  legend,
  legendOffset: -35,
  legendPosition: 'middle',
});

export const bottomLegend: LegendProps = {
  anchor: 'bottom',
  direction: 'row',
  justify: false,
  translateX: 0,
  translateY: 56,
  itemsSpacing: 16,
  itemWidth: 100,
  itemHeight: 18,
  itemTextColor: '#999',
  itemDirection: 'left-to-right',
  itemOpacity: 1,
  symbolSize: 18,
  symbolShape: 'circle',
  effects: [
    {
      on: 'hover',
      style: {
        itemTextColor: '#000',
      },
    },
  ],
};
