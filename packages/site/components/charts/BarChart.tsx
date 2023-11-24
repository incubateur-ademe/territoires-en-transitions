import {BarDatum, ResponsiveBar} from '@nivo/bar';
import {defaultColors} from './chartsTheme';
import {dateAsMonthAndYear} from './utils';
import BarChartTooltip from './BarChartTooltip';

type BarChatyProps = {
  data: BarDatum[];
  keys: string[];
  indexBy: string;
  customColors?: string[];
  axisLeftLabel?: string;
  axisBottomAsYears?: boolean;
};

const BarChart = ({
  data,
  keys,
  indexBy,
  customColors,
  axisLeftLabel,
}: BarChatyProps) => {
  return (
    <ResponsiveBar
      data={data}
      keys={keys}
      indexBy={indexBy}
      margin={{top: 5, right: 5, bottom: 80, left: 50}}
      padding={0.3}
      valueScale={{type: 'linear'}}
      indexScale={{type: 'band', round: true}}
      colors={customColors ?? defaultColors}
      borderColor={{
        from: 'color',
        modifiers: [['darker', 1.6]],
      }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        legendPosition: 'end',
        tickSize: 5,
        tickPadding: 12,
        tickRotation: -35,
        format: dateAsMonthAndYear,
      }}
      axisLeft={
        axisLeftLabel
          ? {
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: axisLeftLabel,
              legendPosition: 'middle',
              legendOffset: -40,
            }
          : undefined
      }
      labelSkipWidth={12}
      labelSkipHeight={12}
      labelTextColor={{
        from: 'color',
        modifiers: [['darker', 1.6]],
      }}
      tooltip={props => <BarChartTooltip {...props} />}
      animate={true}
      motionConfig="slow"
    />
  );
};

export default BarChart;
