'use client';
import { SliceTooltipProps } from '@nivo/line';
import { theme } from './shared';

export const SliceTooltip = (
  props: SliceTooltipProps & { labels: Record<string, string> }
) => {
  const { slice, labels } = props;

  return (
    <div style={theme.tooltip?.container}>
      {slice.points.map((point) => (
        <div
          key={point.id}
          style={{
            color: point.serieColor,
            padding: '3px 0',
          }}
        >
          {labels[point.serieId]}: {point.data.yFormatted}
        </div>
      ))}
    </div>
  );
};
