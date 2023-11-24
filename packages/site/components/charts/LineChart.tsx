import {ResponsiveLine, SliceTooltipProps} from '@nivo/line';
import {defaultColors, theme} from './chartsTheme';
import {axisBottomAsDate, axisLeftMiddleLabel} from './utils';
import LineChartTooltip from './LineChartTooltip';

type LineChartProps = {
  data: {
    id: string;
    color?: string;
    data: {
      x: string | null;
      y: number | null;
    }[];
  }[];
  yFormat?: string;
  customColors?: string[];
  customMargin?: {top: number; right: number; bottom: number; left: number};
  stacked?: boolean;
  enableArea?: boolean;
  enablePoints?: boolean;
  axisLeftLabel?: string;
  customTooltip?: ({slice}: SliceTooltipProps) => JSX.Element;
};

const LineChart = ({
  data,
  yFormat = ' >-.0f',
  customColors,
  customMargin,
  stacked = false,
  enablePoints = false,
  enableArea = false,
  axisLeftLabel,
  customTooltip,
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
      yFormat={yFormat}
      axisBottom={axisBottomAsDate}
      axisLeft={axisLeftLabel ? axisLeftMiddleLabel(axisLeftLabel) : undefined}
      enableArea={enableArea} // surfaces sous les lignes
      areaOpacity={0.9}
      curve="monotoneX" // on interpole la ligne de façon bien passer sur les points
      enablePoints={enablePoints}
      lineWidth={!enableArea ? 4 : undefined}
      pointSize={enablePoints ? 4 : undefined}
      pointColor={{theme: 'background'}}
      pointBorderWidth={4}
      pointBorderColor={{from: 'serieColor'}}
      enableSlices="x"
      sliceTooltip={slice =>
        customTooltip ? customTooltip(slice) : <LineChartTooltip {...slice} />
      }
      animate={true}
      motionConfig="slow"
    />
  );
};

export default LineChart;
