import {AxisProps} from '@nivo/axes';

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
  legendOffset: -45,
  legendPosition: 'middle',
});
