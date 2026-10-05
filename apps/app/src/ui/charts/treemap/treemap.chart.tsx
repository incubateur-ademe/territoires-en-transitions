import ChartLegend from '@/app/ui/charts/ChartLegend';
import { EChartsOption, ReactECharts } from '@/app/ui/charts/echarts';
import { renderToString } from '@/app/ui/charts/echarts/renderToString';
import { readCaption } from '@/app/ui/charts/matrix/read-children';
import { cn, preset } from '@tet/ui';
import type { TreemapSeriesOption } from 'echarts/charts';
import { useMemo, type JSX, type ReactNode } from 'react';
import { toTileColor } from './to-tile-color';
import {
  toGroupKey,
  toHoveredNodeByKey,
  toTileKey,
} from './to-hovered-node-by-key';
import type { HexColor, IntensityScale, TreemapGroup } from './treemap-group';
import { TreemapTooltip } from './treemap.tooltip';

const { colors } = preset.theme.extend;

type TreemapChartProps<TIntensity extends string> = {
  data: readonly TreemapGroup<NoInfer<TIntensity>>[];
  intensityScale: IntensityScale<TIntensity>;
  formatValue: (value: number) => string;
  children?: ReactNode;
  className?: string;
};

const LEGEND_COLOR: HexColor = colors.primary[9];

const TREEMAP_LEVELS: TreemapSeriesOption['levels'] = [
  { itemStyle: { borderWidth: 0, gapWidth: 4 } },
  {
    itemStyle: { borderWidth: 2, gapWidth: 2 },
    upperLabel: {
      show: true,
      height: 24,
      color: colors.primary[9],
      fontSize: 12,
      fontWeight: 'bold',
      overflow: 'truncate',
    },
  },
  {
    itemStyle: { borderWidth: 0 },
    label: {
      position: 'insideTopLeft',
      color: colors.grey[9],
      fontSize: 10,
      overflow: 'truncate',
    },
  },
];

const carriesNodeKey = (
  candidate: unknown
): candidate is { data: { id: string } } =>
  typeof candidate === 'object' &&
  candidate !== null &&
  'data' in candidate &&
  typeof candidate.data === 'object' &&
  candidate.data !== null &&
  'id' in candidate.data &&
  typeof candidate.data.id === 'string';

const toSeriesData = <TIntensity extends string>({
  data,
  intensityScale,
}: {
  data: readonly TreemapGroup<NoInfer<TIntensity>>[];
  intensityScale: IntensityScale<TIntensity>;
}): TreemapSeriesOption['data'] =>
  data.map((group) => ({
    id: toGroupKey(group),
    name: group.label,
    itemStyle: { borderColor: group.color },
    children: group.tiles.map((tile) => ({
      id: toTileKey({ group, tile }),
      name: tile.label,
      value: tile.value,
      itemStyle: {
        color: toTileColor({
          color: group.color,
          intensity: tile.intensity,
          intensityScale,
        }),
      },
    })),
  }));

const buildOption = <TIntensity extends string>({
  data,
  intensityScale,
  formatValue,
}: {
  data: readonly TreemapGroup<NoInfer<TIntensity>>[];
  intensityScale: IntensityScale<TIntensity>;
  formatValue: (value: number) => string;
}): EChartsOption => {
  const hoveredNodeByKey = toHoveredNodeByKey(data);
  return {
    tooltip: {
      trigger: 'item',
      confine: true,
      borderColor: colors.grey[4],
      backgroundColor: colors.grey[1],
      padding: 12,
      formatter: (params: unknown): string => {
        if (!carriesNodeKey(params)) {
          return '';
        }
        const hovered = hoveredNodeByKey.get(params.data.id);
        return hovered
          ? renderToString(
              <TreemapTooltip hovered={hovered} formatValue={formatValue} />
            )
          : '';
      },
    },
    series: [
      {
        type: 'treemap',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        levels: TREEMAP_LEVELS,
        data: toSeriesData({ data, intensityScale }),
      },
    ],
  };
};

const TilesList = <TIntensity extends string>({
  data,
  formatValue,
}: {
  data: readonly TreemapGroup<TIntensity>[];
  formatValue: (value: number) => string;
}): JSX.Element => (
  <ul className="sr-only">
    {data.map((group) => (
      <li key={group.id}>
        {group.label}
        <ul>
          {group.tiles.map((tile) => (
            <li key={tile.id}>
              {[tile.label, tile.intensity, formatValue(tile.value)].join(', ')}
            </li>
          ))}
        </ul>
      </li>
    ))}
  </ul>
);

const TreemapChart = <TIntensity extends string>({
  data,
  intensityScale,
  formatValue,
  children,
  className,
}: TreemapChartProps<TIntensity>): JSX.Element => {
  const caption = readCaption(children);
  const option = useMemo(
    () => buildOption({ data, intensityScale, formatValue }),
    [data, intensityScale, formatValue]
  );
  const legendItems = intensityScale.map((intensity) => ({
    name: intensity,
    color: toTileColor({ color: LEGEND_COLOR, intensity, intensityScale }),
  }));

  return (
    <figure className={cn('m-0 flex h-96 w-full flex-col', className)}>
      <div aria-hidden className="min-h-0 w-full grow">
        <ReactECharts
          renderer="svg"
          style={{ width: '100%', height: '100%' }}
          option={option}
        />
      </div>
      <ChartLegend isOpen size="sm" className="mt-4" items={legendItems} />
      <figcaption className="sr-only">{caption}</figcaption>
      <TilesList data={data} formatValue={formatValue} />
    </figure>
  );
};

export { TreemapChart };
