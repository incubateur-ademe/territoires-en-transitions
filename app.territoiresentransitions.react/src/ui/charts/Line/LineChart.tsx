import {LineSvgProps, ResponsiveLine} from '@nivo/line';

import {defaultColors, theme} from '../chartsTheme';
import ChartLegend, {ChartLegendProps} from '../ChartLegend';
import classNames from 'classnames';
import {generateLineLegendItems} from 'ui/charts/Line/utils';

export type LineData = {
  id: string;
  data: {
    x: number | string | Date;
    y: number | string | Date;
  }[];
  color?: string;
  symbole?: (color: string) => React.ReactNode;
};

export type LineChartProps = {
  /** tableau de données à afficher */
  data: LineData[];
  /** Permet d'afficher et configurer la légende */
  legend?: ChartLegendProps;
  /** Classname du container, permet notamment de donner la hauteur du graphe.*/
  className?: string;
  /** Legende de l'ordonnée */
  axisLeftLegend?: string | React.ReactNode;
} & LineSvgProps;

/**
 * Affiche un graphique de type "ligne"
 */
const LineChart = ({
  data,
  legend,
  className,
  axisLeftLegend,
  ...nivoLineProps
}: LineChartProps) => {
  return (
    <div className="flex flex-col">
      {axisLeftLegend && (
        <div className="ml-3 text-sm text-grey-9">{axisLeftLegend}</div>
      )}
      <div className={classNames('h-[24rem]', className)}>
        {/** Chart */}
        <ResponsiveLine
          data={data}
          theme={theme}
          colors={defaultColors}
          // on interpole la ligne de façon bien passer sur les points
          curve="monotoneX"
          enableGridX
          enableGridY
          margin={{top: 16, right: 48, bottom: 48, left: 48}}
          pointSize={6}
          enableSlices="x"
          animate
          xScale={{
            type: 'linear',
            min: 'auto',
            max: 'auto',
          }}
          {...nivoLineProps}
        />
      </div>
      {/** Légende */}
      {legend?.isOpen && (
        <ChartLegend {...legend} items={generateLineLegendItems(data)} />
      )}
    </div>
  );
};

export default LineChart;
