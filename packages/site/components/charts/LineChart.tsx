import {ResponsiveLine, SliceTooltipProps} from '@nivo/line';
import {defaultColors, theme} from './chartsTheme';
import {axisBottomAsDate, axisLeftMiddleLabel} from './utils';

const getTooltip = (
  {slice}: SliceTooltipProps,
  data: {
    id: string;
    color?: string;
    data: {
      x: string | null;
      y: number | null;
    }[];
  }[],
) => {
  return (
    <div style={theme.tooltip?.container}>
      <div>
        <strong>
          {slice.points.map(p => p.data.y as number).reduce((a, b) => a + b, 0)}
        </strong>{' '}
        collectivités, dont :
      </div>
      {slice.points.map(point => (
        <div
          key={point.id}
          style={{
            color: point.serieColor,
            padding: '3px 0',
          }}
        >
          {point.data.yFormatted} {point.serieId}
        </div>
      ))}
    </div>
  );
};

type LineChartProps = {
  data: {
    id: string;
    color?: string;
    data: {
      x: string | null;
      y: number | null;
    }[];
  }[];
  customColors?: string[];
  customMargin?: {top: number; right: number; bottom: number; left: number};
  stacked?: boolean;
  enableArea?: boolean;
  enablePoints?: boolean;
  axisLeftLabel?: string;
};

const LineChart = ({
  data,
  customColors,
  customMargin,
  stacked = false,
  enablePoints = false,
  enableArea = false,
  axisLeftLabel,
}: LineChartProps) => {
  return (
    <ResponsiveLine
      data={data}
      colors={customColors ? customColors : defaultColors}
      theme={theme}
      margin={customMargin ?? {top: 5, right: 5, bottom: 80, left: 50}}
      xScale={{type: 'point'}}
      yScale={{
        type: 'linear',
        min: 0,
        max: 'auto',
        stacked: stacked,
      }}
      yFormat=" >-.0f"
      axisBottom={axisBottomAsDate}
      axisLeft={axisLeftLabel ? axisLeftMiddleLabel(axisLeftLabel) : undefined}
      enableArea={enableArea} // surfaces sous les lignes
      areaOpacity={0.9}
      curve="monotoneX" // on interpole la ligne de façon bien passer sur les points
      enablePoints={enablePoints}
      pointColor={{theme: 'background'}}
      pointBorderWidth={3}
      pointBorderColor={{from: 'serieColor'}}
      enableSlices="x"
      sliceTooltip={slice => getTooltip(slice, data)}
      animate={true}
      motionConfig="slow"
    />
  );
};

export default LineChart;
