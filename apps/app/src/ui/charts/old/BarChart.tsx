import { appLabels } from '@/app/labels/catalog';
import { ReactECharts, type EChartsOption } from '@/app/ui/charts/echarts';
import { CHART_FONT_FAMILY } from '@/app/ui/charts/echarts/constants';
import { renderToString } from '@/app/ui/charts/echarts/renderToString';
import { Colon } from '@/app/ui/colon';
import { defaultColors } from '../chartsTheme';

/** Une ligne du graphe : la valeur d'index, une valeur par clé, et
 * optionnellement `${clé}_color` et `clickable` ('true' | 'false') */
export type BarDatum = Record<string, string | number | null>;

const upperCaseFirstLetter = (value: string): string =>
  `${value.slice(0, 1).toUpperCase()}${value.slice(1).toLowerCase()}`;

const isClickable = (d: BarDatum | undefined) =>
  !!d && (!('clickable' in d) || d.clickable === 'true');

const BarTooltip = ({
  title,
  serieName,
  value,
  color,
  unit,
  clickable,
}: {
  title: string;
  serieName: string;
  value: number;
  color: string;
  unit: string;
  clickable: boolean;
}) => (
  <div className="flex flex-col items-start text-sm">
    <div>{title}</div>
    <div className="flex items-center">
      <div className="w-3 h-3 mr-2" style={{ backgroundColor: color }} />
      <span>
        {serieName}
        <Colon />
        <strong>
          {Math.round(value * 10) / 10} {unit}
        </strong>
      </span>
    </div>
    {clickable && (
      <div className="text-[#929292] pt-4">
        {appLabels.cliquezPourVoirDetail}
      </div>
    )}
  </div>
);

export type BarChartProps = {
  data: BarDatum[];
  indexBy: string;
  keys: string[];
  indexTitles?: string[];
  layout?: 'horizontal' | 'vertical';
  groupMode?: 'grouped' | 'stacked';
  inverted?: boolean;
  customColors?: boolean;
  unit?: string;
  isIntoModal?: boolean;
  onSelectIndex?: (index: string | number) => void;
};

/**
 * Graphe bar générique (ECharts)
 *
 * @param data - tableau de données à afficher
 * @param indexBy string - élément de data utilisé pour indexer les autres données
 * @param keys string[] - éléments utilisés pour déterminer chaque série de données
 * @param indexTitles string[] (optionnel) - permet d'afficher des valeurs différentes de indexBy dans la tooltip
 * @param layout 'horizontal' | 'vertical' (optionnel) - orientation du graphe, par défaut vertical
 * @param groupMode 'grouped' | 'stacked' (optionnel) - par défaut stacked
 * @param inverted boolean (optionnel) - inverse l'ordre d'affichage des valeurs sur l'axe indexBy
 * @param customColors boolean (optionnel) - signale la présence de couleurs custom (`${clé}_color`) dans data
 * @param unit string (optionnel) - unité des éléments listés dans keys
 * @param onSelectIndex renvoie l'index de l'élément sur lequel on a cliqué
 */
const BarChart = ({
  data,
  indexBy,
  keys,
  indexTitles = [],
  layout = 'vertical',
  groupMode = 'stacked',
  inverted = false,
  customColors = false,
  unit = '',
  isIntoModal,
  onSelectIndex,
}: BarChartProps) => {
  const localData = inverted ? [...data].reverse() : data;
  const localIndexTitles = inverted ? [...indexTitles].reverse() : indexTitles;
  const isHorizontal = layout === 'horizontal';

  const fontSizes = isIntoModal
    ? { label: 22, tick: 18, axisName: 20 }
    : { label: 14, tick: 13, axisName: 14 };

  const categoryAxis = {
    type: 'category' as const,
    data: localData.map((d) => String(d[indexBy])),
    name: upperCaseFirstLetter(indexBy),
    nameLocation: 'middle' as const,
    nameGap: isIntoModal ? 50 : 35,
    nameTextStyle: { fontSize: fontSizes.axisName },
    axisLabel: { fontSize: fontSizes.tick, fontWeight: 'bold' as const },
  };
  const valueAxis = {
    type: 'value' as const,
    name: upperCaseFirstLetter(unit),
    nameLocation: 'middle' as const,
    nameGap: isIntoModal ? 45 : 30,
    nameTextStyle: { fontSize: fontSizes.axisName },
    axisLabel: { fontSize: fontSizes.tick },
  };

  const option: EChartsOption = {
    textStyle: { fontFamily: CHART_FONT_FAMILY },
    animation: false,
    grid: {
      top: isHorizontal ? 20 : 40,
      right: 40,
      bottom: isIntoModal ? 70 : 50,
      left: isIntoModal ? 80 : 60,
    },
    xAxis: isHorizontal ? valueAxis : categoryAxis,
    yAxis: isHorizontal ? categoryAxis : valueAxis,
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (Array.isArray(params)) return '';
        const { dataIndex, name, seriesName, value, color } = params;
        return renderToString(
          <BarTooltip
            title={localIndexTitles[dataIndex] ?? name}
            serieName={seriesName ?? ''}
            value={Number(value)}
            color={String(color)}
            unit={unit}
            clickable={!!onSelectIndex && isClickable(localData[dataIndex])}
          />
        );
      },
    },
    series: keys.map((key, i) => ({
      type: 'bar' as const,
      name: key,
      stack: groupMode === 'stacked' ? 'total' : undefined,
      barCategoryGap: isHorizontal ? '10%' : '50%',
      barGap: groupMode === 'grouped' ? '5%' : undefined,
      cursor: onSelectIndex ? 'pointer' : 'default',
      color: customColors
        ? String(localData[0]?.[`${key}_color`] ?? '')
        : defaultColors[i % defaultColors.length],
      label: {
        show: true,
        fontSize: fontSizes.label,
        fontWeight: 'bold' as const,
        color: '#2A2A62',
        formatter: ({ value }) => {
          const rounded = Math.round(Number(value));
          return rounded === 0 ? '' : String(rounded);
        },
      },
      labelLayout: { hideOverlap: true },
      data: localData.map((d) => Number(d[key] ?? 0)),
    })),
  };

  return (
    <div className="w-full h-full min-h-0 flex-1">
      <ReactECharts
        option={option}
        style={{ height: '100%' }}
        onEvents={
          onSelectIndex
            ? {
                click: ({ event }) => {
                  if (!('dataIndex' in event)) return;
                  const d = localData[event.dataIndex];
                  if (isClickable(d)) onSelectIndex(String(d[indexBy]));
                },
              }
            : undefined
        }
      />
    </div>
  );
};

export default BarChart;
