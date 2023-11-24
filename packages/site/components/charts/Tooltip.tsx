import {SliceTooltipProps} from '@nivo/line';
import {theme} from './chartsTheme';
import {getFormattedNumber} from 'src/utils/getFormattedNumber';

const Tooltip = ({slice}: SliceTooltipProps) => (
  <div style={theme.tooltip?.container}>
    {slice.points.map(point => (
      <div key={point.id} style={{padding: '3px 0'}}>
        <Color fill={point.serieColor} />
        {point.serieId} <b>{getFormattedNumber(point.data.yFormatted)}</b>
      </div>
    ))}
  </div>
);

const Color = ({fill}: {fill: string}) => (
  <span
    style={{
      height: 12,
      width: 12,
      backgroundColor: fill,
      display: 'inline-block',
      marginRight: 12,
    }}
  />
);

export default Tooltip;
