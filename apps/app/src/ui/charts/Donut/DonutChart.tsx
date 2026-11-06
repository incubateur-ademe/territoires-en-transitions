import { ReactECharts, type EChartsOption } from '@/app/ui/charts/echarts';
import { CHART_FONT_FAMILY } from '@/app/ui/charts/echarts/constants';
import { renderToString } from '@/app/ui/charts/echarts/renderToString';
import { getDataColor } from '@/app/ui/charts/utils';
import classNames from 'classnames';
import ChartLegend, { ChartLegendProps } from '../ChartLegend';
import { DonutTooltip } from './DonutTooltip';
import { generateDonutLegendItems, getPercentage } from './utils';

export type DonutData = {
  id: string;
  value: number;
  color?: string;
  symbole?: (color: string) => React.ReactNode;
};

/** Types du graphique Donut */
export type DonutChartProps = {
  /** tableau de données à afficher */
  data: DonutData[];
  /** unité des valeurs */
  unit?: string;
  /** affichage des labels sur le côté des arcs */
  displayOutsideLabel?: boolean;
  /** Affiche les valeurs en pourcentage */
  displayPercentageValue?: boolean;
  /** affichage d'un élément au centre du donut */
  centeredElement?: React.ReactNode;
  /** Clique sur un arc */
  onClick?: (id: string) => void;
  /** Permet d'afficher et configurer la légende */
  legend?: ChartLegendProps;
  /** Classname du container, permet notamment de donner la hauteur du graphe.*/
  className?: string;
};

const NO_DATA_COLOR = '#ccc';

/** Graphe donut générique (ECharts) */
const DonutChart = ({
  data,
  unit,
  displayOutsideLabel = false,
  displayPercentageValue = false,
  centeredElement,
  onClick,
  className,
  legend,
}: DonutChartProps) => {
  const hasNoData = data.every((d) => d.value === 0);

  const localData = data.map((d, index) => ({
    ...d,
    color: getDataColor(d, data.length, index),
  }));
  const values = localData.map((d) => d.value);

  const formatValue = (value: number) =>
    displayPercentageValue
      ? `${getPercentage(value, values)} %`
      : `${Math.round(value)}`;

  const option: EChartsOption = {
    textStyle: { fontFamily: CHART_FONT_FAMILY },
    tooltip: {
      show: !hasNoData,
      trigger: 'item',
      formatter: (params) => {
        if (Array.isArray(params) || typeof params.value !== 'number') {
          return '';
        }
        return renderToString(
          <DonutTooltip
            id={params.name}
            value={params.value}
            color={String(params.color)}
            values={values}
            unit={unit}
          />
        );
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '80%'],
        padAngle: 1,
        cursor: onClick ? 'pointer' : 'default',
        itemStyle: { borderRadius: 4 },
        emphasis: { scale: !hasNoData, scaleSize: 8 },
        labelLayout: { hideOverlap: true },
        minShowLabelAngle: 12,
        label: hasNoData
          ? { show: false }
          : displayOutsideLabel
            ? {
                position: 'outside',
                fontSize: 14,
                fontWeight: 500,
                color: '#333',
                formatter: ({ name, value }) =>
                  `${name} : ${formatValue(Number(value))}`,
              }
            : {
                position: 'inside',
                fontSize: 14,
                fontWeight: 500,
                formatter: ({ value }) => formatValue(Number(value)),
              },
        labelLine: { length: 12, length2: 6, lineStyle: { width: 2 } },
        data: hasNoData
          ? [{ name: 'NA', value: 1, itemStyle: { color: NO_DATA_COLOR } }]
          : localData.map((d) => ({
              name: d.id,
              value: d.value,
              itemStyle: { color: d.color },
            })),
      },
    ],
  };

  return (
    <div className="flex flex-col">
      <div className={classNames('relative h-64', className)}>
        <ReactECharts
          option={option}
          style={{ height: '100%' }}
          onEvents={
            onClick && !hasNoData
              ? {
                  click: ({ event }) => {
                    if ('name' in event) onClick(event.name);
                  },
                }
              : undefined
          }
        />
        {!!centeredElement && (
          <div className="absolute inset-0 flex pointer-events-none">
            <div className="m-auto text-center">{centeredElement}</div>
          </div>
        )}
      </div>
      {legend?.isOpen && (
        <ChartLegend {...legend} items={generateDonutLegendItems(data)} />
      )}
    </div>
  );
};

export default DonutChart;
