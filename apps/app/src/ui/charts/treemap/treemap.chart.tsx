import ChartLegend from '@/app/ui/charts/ChartLegend';
import { EChartsOption, ReactECharts } from '@/app/ui/charts/echarts';
import { renderToString } from '@/app/ui/charts/echarts/renderToString';
import { useResizeGraphOnContainerSizeUpdate } from '@/app/ui/charts/echarts/use-resize-graph-on-container-size-update';
import { readCaption } from '@/app/ui/charts/matrix/read-children';
import { cn, preset } from '@tet/ui';
import type { TreemapSeriesOption } from 'echarts/charts';
import { useMemo, useRef, type JSX, type ReactNode } from 'react';
import { toTileColor } from './to-tile-color';
import {
  type HoveredNode,
  toGroupKey,
  toHoveredNodeByKey,
  toTileKey,
} from './to-hovered-node-by-key';
import type {
  HexColor,
  IntensityScale,
  IntensityVariant,
  TreemapGroup,
} from './treemap-group';
import { TreemapTooltip } from './treemap.tooltip';

const { colors } = preset.theme.extend;

type TreemapChartProps<TIntensity extends string, TGroupId extends string> = {
  data: readonly TreemapGroup<NoInfer<TIntensity>, TGroupId>[];
  intensityScale: IntensityScale<TIntensity>;
  formatValue: (value: number) => string;
  toIntensityLabel?: (intensity: TIntensity) => string;
  toIntensityVariant?: (intensity: TIntensity) => IntensityVariant;
  tooltipHint?: string;
  selectedGroupId?: TGroupId;
  onGroupSelected?: (groupId: TGroupId, tileId?: string) => void;
  children?: ReactNode;
  className?: string;
};

type TreemapLabels<TIntensity extends string> = {
  formatValue: (value: number) => string;
  toIntensityLabel: (intensity: TIntensity) => string;
};

type GroupLabelProps<TIntensity extends string, TGroupId extends string> = {
  group: TreemapGroup<TIntensity, TGroupId>;
  isSelected: boolean;
  onGroupSelected?: (groupId: TGroupId, tileId?: string) => void;
};

type TilesListProps<
  TIntensity extends string,
  TGroupId extends string
> = TreemapLabels<TIntensity> & {
  data: readonly TreemapGroup<TIntensity, TGroupId>[];
  selectedGroupId?: TGroupId;
  onGroupSelected?: (groupId: TGroupId, tileId?: string) => void;
};

const LEGEND_COLOR: HexColor = colors.primary[9];

const SELECTED_GROUP_COLOR: HexColor = colors.primary[7];

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

const toIdentityLabel = (intensity: string): string => intensity;

const toGreyVariant = (): IntensityVariant => 'grey';

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

const toSeriesData = <TIntensity extends string, TGroupId extends string>({
  data,
  intensityScale,
  selectedGroupId,
}: {
  data: readonly TreemapGroup<NoInfer<TIntensity>, TGroupId>[];
  intensityScale: IntensityScale<TIntensity>;
  selectedGroupId?: TGroupId;
}): TreemapSeriesOption['data'] =>
  data.map((group) => {
    const isSelectedGroup = group.id === selectedGroupId;
    return {
      id: toGroupKey(group),
      name: group.label,
      itemStyle: {
        borderColor: isSelectedGroup ? SELECTED_GROUP_COLOR : group.color,
      },
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
    };
  });

const buildOption = <TIntensity extends string, TGroupId extends string>({
  data,
  intensityScale,
  formatValue,
  toIntensityLabel,
  toIntensityVariant,
  tooltipHint,
  selectedGroupId,
  hoveredNodeByKey,
}: TreemapLabels<TIntensity> & {
  data: readonly TreemapGroup<NoInfer<TIntensity>, TGroupId>[];
  intensityScale: IntensityScale<TIntensity>;
  toIntensityVariant: (intensity: TIntensity) => IntensityVariant;
  tooltipHint?: string;
  selectedGroupId?: TGroupId;
  hoveredNodeByKey: ReadonlyMap<string, HoveredNode<TIntensity, TGroupId>>;
}): EChartsOption => ({
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
            <TreemapTooltip
              hovered={hovered}
              formatValue={formatValue}
              toIntensityLabel={toIntensityLabel}
              toIntensityVariant={toIntensityVariant}
              hint={tooltipHint}
            />
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
      data: toSeriesData({ data, intensityScale, selectedGroupId }),
    },
  ],
});

const GroupLabel = <TIntensity extends string, TGroupId extends string>({
  group,
  isSelected,
  onGroupSelected,
}: GroupLabelProps<TIntensity, TGroupId>): JSX.Element => {
  if (onGroupSelected === undefined) {
    return <span>{group.label}</span>;
  }
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onGroupSelected(group.id)}
    >
      {group.label}
    </button>
  );
};

const TilesList = <TIntensity extends string, TGroupId extends string>({
  data,
  formatValue,
  toIntensityLabel,
  selectedGroupId,
  onGroupSelected,
}: TilesListProps<TIntensity, TGroupId>): JSX.Element => (
  <ul className="sr-only">
    {data.map((group) => (
      <li key={group.id}>
        <GroupLabel
          group={group}
          isSelected={group.id === selectedGroupId}
          onGroupSelected={onGroupSelected}
        />
        <ul>
          {group.tiles.map((tile) => (
            <li key={tile.id}>
              {[
                tile.label,
                toIntensityLabel(tile.intensity),
                formatValue(tile.value),
              ].join(', ')}
            </li>
          ))}
        </ul>
      </li>
    ))}
  </ul>
);

const TreemapChart = <
  TIntensity extends string,
  TGroupId extends string = string
>({
  data,
  intensityScale,
  formatValue,
  toIntensityLabel = toIdentityLabel,
  toIntensityVariant = toGreyVariant,
  tooltipHint,
  selectedGroupId,
  onGroupSelected,
  children,
  className,
}: TreemapChartProps<TIntensity, TGroupId>): JSX.Element => {
  const plotRef = useRef<HTMLDivElement>(null);
  useResizeGraphOnContainerSizeUpdate({ containerRef: plotRef });
  const caption = readCaption(children);
  const hoveredNodeByKey = useMemo(() => toHoveredNodeByKey(data), [data]);
  const option = useMemo(
    () =>
      buildOption({
        data,
        intensityScale,
        formatValue,
        toIntensityLabel,
        toIntensityVariant,
        tooltipHint,
        selectedGroupId,
        hoveredNodeByKey,
      }),
    [
      data,
      intensityScale,
      formatValue,
      toIntensityLabel,
      toIntensityVariant,
      tooltipHint,
      selectedGroupId,
      hoveredNodeByKey,
    ]
  );
  const onEvents = useMemo(
    () => ({
      click: ({ event }: { event: unknown }): void => {
        if (!carriesNodeKey(event)) {
          return;
        }
        const clicked = hoveredNodeByKey.get(event.data.id);
        if (clicked === undefined) {
          return;
        }
        const tileId = clicked.kind === 'tile' ? clicked.tile.id : undefined;
        onGroupSelected?.(clicked.group.id, tileId);
      },
    }),
    [hoveredNodeByKey, onGroupSelected]
  );
  const legendItems = intensityScale.map((intensity) => ({
    name: toIntensityLabel(intensity),
    color: toTileColor({ color: LEGEND_COLOR, intensity, intensityScale }),
  }));

  return (
    <figure className={cn('m-0 flex h-96 w-full flex-col', className)}>
      <div ref={plotRef} aria-hidden className="min-h-0 w-full grow">
        <ReactECharts
          renderer="svg"
          style={{ width: '100%', height: '100%' }}
          option={option}
          onEvents={onEvents}
        />
      </div>
      <ChartLegend isOpen size="sm" className="mt-4" items={legendItems} />
      <figcaption className="sr-only">{caption}</figcaption>
      <TilesList
        data={data}
        formatValue={formatValue}
        toIntensityLabel={toIntensityLabel}
        selectedGroupId={selectedGroupId}
        onGroupSelected={onGroupSelected}
      />
    </figure>
  );
};

export { TreemapChart };
