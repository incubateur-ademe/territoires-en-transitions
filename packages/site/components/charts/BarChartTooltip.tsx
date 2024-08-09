import { BarTooltipProps } from '@nivo/bar';
import { theme } from './chartsTheme';
import { getFormattedNumber } from '@tet/site/src/utils/getFormattedNumber';
import { dateAsMonthAndYear } from './utils';
import TooltipColor from './TooltipColor';

const BarChartTooltip = ({
  id,
  value,
  indexValue,
  color,
}: BarTooltipProps<unknown>) => (
  <div style={theme.tooltip?.container}>
    <div key={id} style={{ padding: '3px 0' }}>
      <TooltipColor fill={color} />
      {id} - {dateAsMonthAndYear(indexValue.toString())} :{' '}
      <b>{getFormattedNumber(value)}</b>
    </div>
  </div>
);

export default BarChartTooltip;
