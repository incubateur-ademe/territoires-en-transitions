import {
  ResponsiveLine,
  LineSvgProps,
  Serie,
  CustomLayerProps,
} from '@nivo/line';
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
        min: 'auto',
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
      pointColor={{from: 'serieColor'}}
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

/** Indexe les libellés des séries par id */
export const getLabelsBySerieId = (data: Serie[]): Record<string, string> =>
  data.reduce((byId, {id, label}) => ({...byId, [id]: label}), {});

/** Génère les lignes en appliquant le style correspondant à l'id de la série */
export const generateStyledLines =
  (styleById: Record<string, {}>) =>
  ({series, lineGenerator, xScale, yScale}: CustomLayerProps) => {
    return series.map(({id, data, color}) => (
      <path
        key={id}
        d={
          lineGenerator(
            data.map(d => ({
              x: (xScale as any)(d.data.x),
              y: (yScale as any)(d.data.y),
            }))
          ) || undefined
        }
        fill="none"
        stroke={color}
        style={styleById[id] || styleById.default}
      />
    ));
  };
