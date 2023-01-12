'use client';
import {SliceTooltipProps} from '@nivo/line';
import {theme} from './shared';

export const SliceTooltip = (
  props: SliceTooltipProps & {labels: Record<string, string>}
) => {
  const {slice, labels} = props;

  return (
    <div style={theme.tooltip?.container}>
      {slice.points.map(point => (
        <div key={point.id} style={{padding: '3px 0'}}>
          <Color fill={point.serieColor} />
          {labels[point.serieId]} <b>{point.data.yFormatted}</b>
        </div>
      ))}
    </div>
  );
};

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
