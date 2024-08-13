import {CSSProperties} from 'react';
import classNames from 'classnames';
import {Datum, LineSvgProps, ResponsiveLine} from '@nivo/line';

import {defaultColors, theme} from '../chartsTheme';
import ChartLegend, {ChartLegendProps} from '../ChartLegend';
import {generateLineLegendItems} from 'ui/charts/Line/utils';

/** Format de données pour une droite du graphique Line */
export type LineData = {
  /** Id nécessaire à Nivo */
  id: string;
  /** Position de chaque points du graphique */
  data: Datum[];
  /** Nom de la droite, l'id est utilisé dans la légende s'il n'est pas donné */
  label?: string;
  /** Couleur de la droite */
  color?: string;
  /** Symbole associé à la droite, notamment utilisé pour la légende */
  symbole?: (color: string) => React.ReactNode;
  /** Styles appliqué à la droite (épaisseur, pointillés, ...) */
  style?: CSSProperties;
};

export type LineChartProps = Omit<LineSvgProps, 'data'> & {
  /** tableau de données à afficher */
  data: LineData[];
  /** Permet d'afficher et configurer la légende */
  legend?: ChartLegendProps;
  /** Classname du graphique, permet notamment de donner la hauteur du graphe.*/
  className?: string;
  /** Legende de l'ordonnée */
  axisLeftLegend?: string | React.ReactNode;
};

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
    <div className="flex flex-col w-full">
      {axisLeftLegend && (
        <div className="ml-3 text-sm text-primary-8">{axisLeftLegend}</div>
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
