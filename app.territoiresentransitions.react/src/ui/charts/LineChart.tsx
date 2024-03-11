import {ResponsiveLine, LineSvgProps} from '@nivo/line';
import {defaultColors, theme} from './chartsTheme';

export type LineChartProps = LineSvgProps & {
  /** légende de l'axe gauche */
  axisLeftLegend?: string;
};

/**
 * Affiche un graphique de type "ligne"
 */
const LineChart = (props: LineChartProps) => {
  const {axisLeftLegend} = props;

  return (
    <ResponsiveLine
      colors={defaultColors}
      theme={theme}
      // les marges servent aux légendes
      margin={{top: 5, right: 25, bottom: 70, left: 90}}
      xScale={{
        type: 'time',
        precision: 'year',
        format: '%Y',
        min: 'auto',
        max: 'auto',
      }}
      yScale={{
        type: 'linear',
        min: 0,
        max: 'auto',
      }}
      // on interpole la ligne de façon bien passer sur les points
      curve="monotoneX"
      enableGridX
      enableGridY
      yFormat={value => Number(value).toLocaleString('fr')}
      axisBottom={{
        legendPosition: 'end',
        tickSize: 5,
        tickPadding: 12,
        tickRotation: 0,
        tickValues: 10,
        format: '%Y',
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: -45,
        tickValues: 4,
        legend: axisLeftLegend || '',
        legendPosition: 'middle',
        legendOffset: -70,
        format: value => Number(value).toLocaleString('fr'),
      }}
      pointSize={3}
      pointBorderWidth={4}
      pointBorderColor={{from: 'serieColor'}}
      pointLabelYOffset={-12}
      enableSlices="x"
      animate
      {...props}
    />
  );
};

export default LineChart;
