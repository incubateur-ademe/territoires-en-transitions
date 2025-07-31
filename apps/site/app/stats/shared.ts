/**
 * Thème partagé par tous les graphiques
 *
 * Surcharge les valeurs par défaut définies dans :
 * https://github.com/plouc/nivo/blob/master/packages/core/src/theming/defaultTheme.js
 */
import { AxisProps } from '@nivo/axes';
import { DatumValue } from '@nivo/core';
import { LegendProps } from '@nivo/legends';
import { Serie } from '@nivo/line';

export const colors = ['#21AB8E', '#FFCA00', '#FF732C', '#FFB7AE', '#34BAB5'];
const fontFamily = '"Marianne", arial, sans-serif';

export const fromMonth = '2022-01-01';

export const theme = {
  fontFamily,
  fontSize: 12,
  axis: {
    legend: {
      text: {
        fontFamily,
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
      background: 'white',
      padding: '9px 12px',
      border: '1px solid #ccc',
    },
  },
} as const;

export const dateAsMonthAndYear = (v: string) =>
  new Date(v).toLocaleDateString('fr', {
    month: 'short',
    year: 'numeric',
  });

export const formatInteger = (value: DatumValue | number | null) =>
  value === null ? '' : Number(value).toLocaleString('fr-FR');

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
  legendOffset: -45,
  legendPosition: 'middle',
});

export const bottomLegend: LegendProps = {
  anchor: 'bottom',
  direction: 'row',
  justify: false,
  translateX: 0,
  translateY: 56,
  itemsSpacing: 16,
  itemWidth: 140,
  itemHeight: 18,
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

export const getLegendData = (
  data: Pick<Serie, 'id' | 'label'>[],
  palette?: string[]
) =>
  data.map(({ id, label }, index) => ({
    id,
    label,
    color: (palette || colors)[index],
  }));

export const getLabelsById = (
  data: Pick<Serie, 'id' | 'label'>[]
): Record<string, string> =>
  data.reduce((byId, { id, label }) => ({ ...byId, [id]: label }), {});
