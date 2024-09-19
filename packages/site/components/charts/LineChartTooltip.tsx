import { SliceTooltipProps } from '@nivo/line';
import { theme } from './chartsTheme';
import { getFormattedNumber } from '@tet/site/src/utils/getFormattedNumber';
import TooltipColor from './TooltipColor';

const LineChartTooltip = ({ slice }: SliceTooltipProps) => (
  <div style={theme.tooltip?.container}>
    {slice.points.map((point) => (
      <div key={point.id} style={{ padding: '3px 0' }}>
        <TooltipColor fill={point.serieColor} />
        {point.serieId} <b>{getFormattedNumber(point.data.yFormatted)}</b>
      </div>
    ))}
  </div>
);

export default LineChartTooltip;
