import { EChartsOption, ReactECharts } from '@/app/ui/charts/echarts';
import { renderToString } from '@/app/ui/charts/echarts/renderToString';
import type { ScatterSeriesOption } from 'echarts/charts';
import { getInstanceByDom } from 'echarts/core';
import { uniq } from 'es-toolkit';
import {
  cn,
  Icon,
  preset,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tet/ui';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type ReactNode,
  type Ref,
} from 'react';
import { ChartTooltip, type ChartTooltipBadge } from '../chart-tooltip';
import { computeBounds } from './compute-bounds';
import { MATRIX_GRID } from './matrix-grid';
import { type AxisProps, toAxisValueLabel } from './axis';
import type { DataTableProps } from './data-table';
import type { MatrixCoord } from './matrix-coord';
import { projectPoints, type PlotSize } from './project-points';
import type { MatrixTone, QuadrantProps, TitleAnchor } from './quadrant';
import {
  readCaption,
  readDataTable,
  readQuadrants,
  readXAxis,
  readYAxis,
} from './read-children';
import {
  placeLabels,
  type Box,
  type LabelPlacements,
  type LabelRequest,
} from './place-labels';

const { colors } = preset.theme.extend;

type MatrixPoint = MatrixCoord & {
  id: string;
  label: string;
  description: string | readonly string[];
  badge?: ChartTooltipBadge;
  hint?: string;
  tone: MatrixTone;
  color?: string;
  isLabelled?: boolean;
};

type MatrixAnchor = {
  pointId: string;
  elementRef: Ref<HTMLSpanElement>;
};

type MatrixChartProps = {
  data: readonly MatrixPoint[];
  children?: ReactNode;
  className?: string;
  legend?: ReactNode;
  labelMaxWidth?: number;
  selectedPointId?: string;
  onPointSelected?: (pointId: string) => void;
  anchor?: MatrixAnchor;
};

const TONE_PALETTE: Record<MatrixTone, { strong: string; soft: string }> = {
  default: { strong: colors.primary[9], soft: colors.primary[2] },
  success: { strong: colors.success[1], soft: colors.success[2] },
  warning: { strong: colors.warning[1], soft: colors.warning[2] },
  error: { strong: colors.error[1], soft: colors.error[2] },
  info: { strong: colors.info[1], soft: colors.info[2] },
  grey: { strong: colors.grey[7], soft: colors.grey[2] },
  light: { strong: colors.grey[7], soft: colors.grey[1] },
};

const TITLE_POSITION: Record<
  TitleAnchor,
  'insideTopLeft' | 'insideTopRight' | 'insideBottomLeft' | 'insideBottomRight'
> = {
  topLeft: 'insideTopLeft',
  topRight: 'insideTopRight',
  bottomLeft: 'insideBottomLeft',
  bottomRight: 'insideBottomRight',
};

const LABEL_HEIGHT = 15;
const LABEL_CHAR_WIDTH = 6;
const POINT_SIZE = 14;
const HOLLOW_POINT_HALO_SIZE = POINT_SIZE + 6;
const SELECTION_OUTLINE_WIDTH = 2;
const SELECTION_OUTLINE_SIZE = POINT_SIZE + 10;
const DASHED_POINT_BORDER_WIDTH = 2;
const DASHED_POINT_DASH_COUNT = 5;
const DASHED_POINT_DASH_SHARE = 0.6;
const DASHED_POINT_PERIOD = (Math.PI * POINT_SIZE) / DASHED_POINT_DASH_COUNT;
const DASHED_POINT_PATTERN = [
  DASHED_POINT_PERIOD * DASHED_POINT_DASH_SHARE,
  DASHED_POINT_PERIOD * (1 - DASHED_POINT_DASH_SHARE),
];
const AXIS_FONT_SIZE = 11;
const AXIS_NAME_ARROW = ' →';
const X_AXIS_NAME_GAP = 16;
const Y_AXIS_NAME_GAP = 24;
const QUADRANT_BADGE_GLYPH = '⚐';
const LABEL_GAP_TO_POINT = 12;
const LABEL_RIGHT_MARGIN = 4;
const DEFAULT_LABEL_MAX_WIDTH = 220;
const QUADRANT_TITLE_INSET = 8;
const QUADRANT_TITLE_DISTANCE = 5;
const QUADRANT_TITLE_CHAR_WIDTH = 8;
const QUADRANT_TITLE_LINE_HEIGHT = 14;
const TRANSPARENT = 'transparent';
const WHITE = '#FFFFFF';
const DESCRIPTION_SEPARATOR = ' · ';
const SELECTION_OUTLINE_TONE: MatrixTone = 'default';

const resizeChartIn = (plot: HTMLDivElement): void => {
  const chartContainer = plot.firstElementChild;
  if (!(chartContainer instanceof HTMLElement)) {
    return;
  }
  getInstanceByDom(chartContainer)?.resize();
};

const carriesDataIndex = (
  candidate: unknown
): candidate is { dataIndex: unknown } =>
  typeof candidate === 'object' &&
  candidate !== null &&
  'dataIndex' in candidate;

const pointAtParams = ({
  params,
  points,
}: {
  params: unknown;
  points: readonly MatrixPoint[];
}): MatrixPoint | undefined => {
  const hovered = Array.isArray(params) ? params[0] : params;
  if (!carriesDataIndex(hovered)) {
    return undefined;
  }
  const { dataIndex } = hovered;
  return typeof dataIndex === 'number' ? points[dataIndex] : undefined;
};

const toDescriptionLines = (
  description: MatrixPoint['description']
): readonly string[] =>
  typeof description === 'string' ? [description] : description;

const PointTooltip = ({ point }: { point: MatrixPoint }): JSX.Element => (
  <ChartTooltip
    title={point.label}
    lines={toDescriptionLines(point.description)}
    badge={point.badge}
    hint={point.hint}
  />
);

type MarkAreaData = NonNullable<
  NonNullable<ScatterSeriesOption['markArea']>['data']
>;

type MarkAreaZone = MarkAreaData[number];

type MarkLineData = NonNullable<
  NonNullable<ScatterSeriesOption['markLine']>['data']
>;

const toQuadrantTitleWidth = ({
  quadrant,
  bounds,
  size,
}: {
  quadrant: QuadrantProps;
  bounds: MatrixCoord;
  size: PlotSize;
}): number | undefined => {
  const plotWidth = size.width - MATRIX_GRID.left - MATRIX_GRID.right;
  const isPlottable = plotWidth > 0 && bounds.x > 0;
  if (!isPlottable) {
    return undefined;
  }
  const quadrantWidth =
    ((quadrant.to.x - quadrant.from.x) / bounds.x) * plotWidth;
  return Math.max(0, quadrantWidth - 2 * QUADRANT_TITLE_INSET);
};

const buildArea = ({
  quadrant,
  titleWidth,
}: {
  quadrant: QuadrantProps;
  titleWidth: number | undefined;
}): MarkAreaZone => {
  const {
    from,
    to,
    title,
    badge,
    tone,
    titleAnchor = 'topLeft',
    colors: override,
  } = quadrant;
  const palette = tone ? TONE_PALETTE[tone] : undefined;
  return [
    {
      coord: [from.x, from.y],
      itemStyle: {
        color: override?.background ?? palette?.soft ?? TRANSPARENT,
        borderWidth: 0,
      },
      label: {
        show: title !== undefined || badge !== undefined,
        formatter: toQuadrantLabel({ badge, title }),
        position: TITLE_POSITION[titleAnchor],
        color: override?.title ?? colors.grey[10],
        fontSize: 11,
        fontWeight: 'normal' as const,
        width: titleWidth,
        overflow: 'break' as const,
        lineHeight: QUADRANT_TITLE_LINE_HEIGHT,
        rich: {
          badge: {
            color: palette?.strong ?? colors.grey[7],
            fontSize: 11,
            fontWeight: 'bold' as const,
          },
        },
      },
    },
    { coord: [to.x, to.y] },
  ];
};

const toQuadrantLabel = ({
  badge,
  title,
}: Pick<QuadrantProps, 'badge' | 'title'>): string => {
  if (badge === undefined) {
    return title ?? '';
  }
  const richBadge = `{badge|${QUADRANT_BADGE_GLYPH} ${badge.toLocaleUpperCase(
    'fr-FR'
  )}}`;
  if (title === undefined) {
    return richBadge;
  }
  return `${richBadge}  ${title}`;
};

const toDividerValues = ({
  quadrants,
  axis,
  bound,
}: {
  quadrants: readonly QuadrantProps[];
  axis: keyof MatrixCoord;
  bound: number;
}): number[] =>
  uniq(quadrants.flatMap(({ from, to }) => [from[axis], to[axis]])).filter(
    (value) => value > 0 && value < bound
  );

const buildDividers = ({
  quadrants,
  bounds,
}: {
  quadrants: readonly QuadrantProps[];
  bounds: MatrixCoord;
}): MarkLineData => [
  ...toDividerValues({ quadrants, axis: 'x', bound: bounds.x }).map(
    (value) => ({ xAxis: value })
  ),
  ...toDividerValues({ quadrants, axis: 'y', bound: bounds.y }).map(
    (value) => ({ yAxis: value })
  ),
];

type MatrixAxis = {
  type: 'value';
  min: number;
  max: number;
  name: string;
  nameLocation: 'middle';
  nameGap: number;
  nameTextStyle: { fontSize: number };
  axisLine: { show: boolean };
  axisTick: { show: boolean };
  splitLine: { show: boolean };
  axisLabel: { show: boolean };
};

const toAxisName = (markers: AxisProps | undefined): string =>
  markers ? `${markers.name}${AXIS_NAME_ARROW}` : '';

const buildAxis = ({
  markers,
  bound,
  nameGap,
}: {
  markers: AxisProps | undefined;
  bound: number;
  nameGap: number;
}): MatrixAxis => ({
  type: 'value' as const,
  min: 0,
  max: bound,
  name: toAxisName(markers),
  nameLocation: 'middle' as const,
  nameGap,
  nameTextStyle: { fontSize: AXIS_FONT_SIZE },
  axisLine: { show: false },
  axisTick: { show: false },
  splitLine: { show: false },
  axisLabel: { show: false },
});

type LabelLayout = {
  x?: number;
  y?: number;
  align: 'left' | 'right';
  verticalAlign: 'middle';
  hideOverlap: false;
};

const placementAt = ({
  placements,
  dataIndex,
}: {
  placements: LabelPlacements;
  dataIndex?: number;
}): LabelLayout => {
  const placement = dataIndex === undefined ? undefined : placements[dataIndex];
  const layout: LabelLayout = {
    align: 'left',
    verticalAlign: 'middle',
    hideOverlap: false,
  };
  if (placement === undefined) {
    return layout;
  }
  return {
    ...layout,
    x: placement.x,
    y: placement.y,
    align: placement.side === 'left' ? 'right' : 'left',
  };
};

const isLabelled = (point: MatrixPoint): boolean => point.isLabelled ?? true;

type PointStyle = {
  color: string;
  borderColor: string;
  borderWidth: number;
  borderType: 'solid' | number[];
};

const toPointColor = (point: MatrixPoint): string =>
  point.color ?? toToneColor(point.tone);

const toToneColor = (tone: MatrixTone): string => TONE_PALETTE[tone].strong;

const isHollowPoint = (point: MatrixPoint): boolean => point.tone === 'light';

const toPointStyle = (point: MatrixPoint): PointStyle => {
  const color = toPointColor(point);
  if (isHollowPoint(point)) {
    return {
      color: WHITE,
      borderColor: color,
      borderWidth: DASHED_POINT_BORDER_WIDTH,
      borderType: DASHED_POINT_PATTERN,
    };
  }
  return {
    color,
    borderColor: TRANSPARENT,
    borderWidth: 0,
    borderType: 'solid',
  };
};

const buildHollowPointHalos = (
  points: readonly MatrixPoint[]
): ScatterSeriesOption[] => {
  const hollowPoints = points.filter(isHollowPoint);
  if (hollowPoints.length === 0) {
    return [];
  }
  return [
    {
      type: 'scatter',
      silent: true,
      z: 1,
      symbolSize: HOLLOW_POINT_HALO_SIZE,
      data: hollowPoints.map((point) => ({
        value: [point.x, point.y],
        itemStyle: { color: WHITE },
      })),
    },
  ];
};

const buildSelectedPointOutline = ({
  points,
  selectedPointId,
}: {
  points: readonly MatrixPoint[];
  selectedPointId: string | undefined;
}): ScatterSeriesOption[] => {
  const selectedPoint = points.find((point) => point.id === selectedPointId);
  if (selectedPoint === undefined) {
    return [];
  }
  return [
    {
      type: 'scatter',
      silent: true,
      z: 1,
      symbolSize: SELECTION_OUTLINE_SIZE,
      data: [
        {
          value: [selectedPoint.x, selectedPoint.y],
          itemStyle: {
            color: TRANSPARENT,
            borderColor: toToneColor(SELECTION_OUTLINE_TONE),
            borderWidth: SELECTION_OUTLINE_WIDTH,
          },
        },
      ],
    },
  ];
};

const buildOption = ({
  points,
  quadrants,
  xAxis,
  yAxis,
  bounds,
  placements,
  labelMaxWidth,
  size,
  selectedPointId,
}: {
  points: readonly MatrixPoint[];
  quadrants: readonly QuadrantProps[];
  xAxis: AxisProps | undefined;
  yAxis: AxisProps | undefined;
  bounds: MatrixCoord;
  placements: LabelPlacements;
  labelMaxWidth: number;
  size: PlotSize;
  selectedPointId: string | undefined;
}): EChartsOption => ({
  tooltip: {
    trigger: 'item',
    confine: true,
    borderColor: colors.grey[4],
    backgroundColor: colors.grey[1],
    padding: 12,
    formatter: (params: unknown): string => {
      const point = pointAtParams({ params, points });
      return point ? renderToString(<PointTooltip point={point} />) : '';
    },
  },
  grid: MATRIX_GRID,
  xAxis: buildAxis({
    markers: xAxis,
    bound: bounds.x,
    nameGap: X_AXIS_NAME_GAP,
  }),
  yAxis: buildAxis({
    markers: yAxis,
    bound: bounds.y,
    nameGap: Y_AXIS_NAME_GAP,
  }),
  series: [
    {
      type: 'scatter',
      symbolSize: POINT_SIZE,
      data: points.map((point, dataIndex) => ({
        name: point.label,
        value: [point.x, point.y],
        itemStyle: toPointStyle(point),
        label: { show: placements[dataIndex] !== undefined },
      })),
      label: {
        formatter: '{b}',
        position: 'right',
        fontSize: 11,
        color: colors.grey[10],
        width: labelMaxWidth,
        overflow: 'truncate',
        ellipsis: '…',
      },
      labelLayout: ({ dataIndex }: { dataIndex?: number }) =>
        placementAt({ placements, dataIndex }),
      markArea: {
        silent: true,
        data: quadrants.map((quadrant) =>
          buildArea({
            quadrant,
            titleWidth: toQuadrantTitleWidth({ quadrant, bounds, size }),
          })
        ),
      },
      markLine: {
        silent: true,
        symbol: 'none',
        label: { show: false },
        lineStyle: { type: 'dashed', color: colors.grey[7], width: 1 },
        data: buildDividers({ quadrants, bounds }),
      },
    },
    ...buildHollowPointHalos(points),
    ...buildSelectedPointOutline({ points, selectedPointId }),
  ],
});

const PointsList = ({
  points,
  xAxis,
  yAxis,
  onPointSelected,
}: {
  points: readonly MatrixPoint[];
  xAxis: AxisProps | undefined;
  yAxis: AxisProps | undefined;
  onPointSelected?: (pointId: string) => void;
}): JSX.Element => (
  <ul className="sr-only">
    {points.map((point) => (
      <li key={point.id}>
        {onPointSelected ? (
          <button type="button" onClick={() => onPointSelected(point.id)}>
            {point.label}
          </button>
        ) : (
          <span>{point.label}</span>
        )}
        <dl>
          {xAxis ? <dt>{xAxis.name}</dt> : null}
          {xAxis ? <dd>{toAxisValueLabel(xAxis, point.x)}</dd> : null}
          {yAxis ? <dt>{yAxis.name}</dt> : null}
          {yAxis ? <dd>{toAxisValueLabel(yAxis, point.y)}</dd> : null}
        </dl>
        <p>
          {toDescriptionLines(point.description).join(DESCRIPTION_SEPARATOR)}
        </p>
      </li>
    ))}
  </ul>
);

const sortByOrdinateDescending = (
  points: readonly MatrixPoint[]
): MatrixPoint[] => [...points].sort((first, second) => second.y - first.y);

const PointsTable = ({
  points,
  xAxis,
  yAxis,
  dataTable,
}: {
  points: readonly MatrixPoint[];
  xAxis: AxisProps;
  yAxis: AxisProps;
  dataTable: DataTableProps;
}): JSX.Element => (
  <details className="group">
    <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-xs font-normal text-primary-8 marker:hidden">
      <Icon
        icon="arrow-right-s-line"
        size="sm"
        className="transition-transform group-open:rotate-90"
        aria-hidden
      />
      {dataTable.toggleLabel}
    </summary>
    <Table className="mt-3 text-sm">
      <TableHead>
        <TableRow>
          <TableHeaderCell title={dataTable.pointHeader} />
          <TableHeaderCell title={yAxis.name} align="right" />
          <TableHeaderCell title={xAxis.name} align="right" />
        </TableRow>
      </TableHead>
      <tbody>
        {sortByOrdinateDescending(points).map((point) => (
          <TableRow key={point.id}>
            <TableCell>{point.label}</TableCell>
            <TableCell className="text-right">
              {toAxisValueLabel(yAxis, point.y)}
            </TableCell>
            <TableCell className="text-right">
              {toAxisValueLabel(xAxis, point.x)}
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  </details>
);

const toLabelWidth = ({
  label,
  labelMaxWidth,
}: {
  label: string;
  labelMaxWidth: number;
}): number => Math.min(labelMaxWidth, label.length * LABEL_CHAR_WIDTH);

const toLabelRequests = ({
  points,
  bounds,
  size,
  labelMaxWidth,
}: {
  points: readonly MatrixPoint[];
  bounds: MatrixCoord;
  size: PlotSize;
  labelMaxWidth: number;
}): LabelRequest[] =>
  projectPoints({ points, bounds, grid: MATRIX_GRID, size })
    .filter(({ dataIndex }) => isLabelled(points[dataIndex]))
    .map(({ dataIndex, x, y }) => ({
      dataIndex,
      pointX: x,
      pointY: y,
      width: toLabelWidth({ label: points[dataIndex].label, labelMaxWidth }),
    }));

const toLabelArea = (size: PlotSize): Box => ({
  left: MATRIX_GRID.left,
  top: MATRIX_GRID.top,
  right: size.width - LABEL_RIGHT_MARGIN,
  bottom: size.height - MATRIX_GRID.bottom,
});

const toPointBoxes = ({
  points,
  bounds,
  size,
}: {
  points: readonly MatrixPoint[];
  bounds: MatrixCoord;
  size: PlotSize;
}): Box[] =>
  projectPoints({ points, bounds, grid: MATRIX_GRID, size }).map(
    ({ x, y }) => ({
      left: x - POINT_SIZE / 2,
      top: y - POINT_SIZE / 2,
      right: x + POINT_SIZE / 2,
      bottom: y + POINT_SIZE / 2,
    })
  );

const toQuadrantBox = ({
  quadrant,
  bounds,
  size,
}: {
  quadrant: QuadrantProps;
  bounds: MatrixCoord;
  size: PlotSize;
}): Box | undefined => {
  const [from, to] = projectPoints({
    points: [quadrant.from, quadrant.to],
    bounds,
    grid: MATRIX_GRID,
    size,
  });
  if (from === undefined || to === undefined) {
    return undefined;
  }
  return {
    left: Math.min(from.x, to.x),
    top: Math.min(from.y, to.y),
    right: Math.max(from.x, to.x),
    bottom: Math.max(from.y, to.y),
  };
};

const toQuadrantLabelLength = ({
  badge,
  title,
}: Pick<QuadrantProps, 'badge' | 'title'>): number =>
  (badge === undefined ? 0 : QUADRANT_BADGE_GLYPH.length + 1 + badge.length) +
  (title?.length ?? 0);

const toQuadrantTitleBox = ({
  quadrant,
  bounds,
  size,
}: {
  quadrant: QuadrantProps;
  bounds: MatrixCoord;
  size: PlotSize;
}): Box | undefined => {
  const quadrantBox = toQuadrantBox({ quadrant, bounds, size });
  const labelLength = toQuadrantLabelLength(quadrant);
  if (labelLength === 0 || quadrantBox === undefined) {
    return undefined;
  }
  const titleTextWidth = labelLength * QUADRANT_TITLE_CHAR_WIDTH;
  const titleMaxWidth =
    toQuadrantTitleWidth({ quadrant, bounds, size }) ?? titleTextWidth;
  const width = Math.min(titleTextWidth, titleMaxWidth);
  const lineCount = Math.max(1, Math.ceil(titleTextWidth / titleMaxWidth));
  const height = lineCount * QUADRANT_TITLE_LINE_HEIGHT;
  const anchor = quadrant.titleAnchor ?? 'topLeft';
  const isOnRight = anchor === 'topRight' || anchor === 'bottomRight';
  const isAtBottom = anchor === 'bottomLeft' || anchor === 'bottomRight';
  const left = isOnRight
    ? quadrantBox.right - QUADRANT_TITLE_DISTANCE - width
    : quadrantBox.left + QUADRANT_TITLE_DISTANCE;
  const top = isAtBottom
    ? quadrantBox.bottom - QUADRANT_TITLE_DISTANCE - height
    : quadrantBox.top + QUADRANT_TITLE_DISTANCE;
  return { left, top, right: left + width, bottom: top + height };
};

const toLabelObstacles = ({
  points,
  quadrants,
  bounds,
  size,
}: {
  points: readonly MatrixPoint[];
  quadrants: readonly QuadrantProps[];
  bounds: MatrixCoord;
  size: PlotSize;
}): Box[] => [
  ...toPointBoxes({ points, bounds, size }),
  ...quadrants.flatMap((quadrant) => {
    const titleBox = toQuadrantTitleBox({ quadrant, bounds, size });
    return titleBox === undefined ? [] : [titleBox];
  }),
];

type AnchorTarget = {
  box: Box;
  elementRef: Ref<HTMLSpanElement>;
};

const toAnchorTarget = ({
  anchor,
  points,
  bounds,
  size,
}: {
  anchor?: MatrixAnchor;
  points: readonly MatrixPoint[];
  bounds: MatrixCoord;
  size: PlotSize;
}): AnchorTarget | undefined => {
  if (anchor === undefined) {
    return undefined;
  }
  const point = points.find(({ id }) => id === anchor.pointId);
  if (point === undefined) {
    return undefined;
  }
  const [box] = toPointBoxes({ points: [point], bounds, size });
  if (box === undefined) {
    return undefined;
  }
  return { box, elementRef: anchor.elementRef };
};

const AnchorSpot = ({ box, elementRef }: AnchorTarget): JSX.Element => (
  <span
    ref={elementRef}
    className="pointer-events-none absolute"
    style={{
      left: box.left,
      top: box.top,
      width: box.right - box.left,
      height: box.bottom - box.top,
    }}
  />
);

const MatrixChart = ({
  data,
  children,
  className,
  legend,
  labelMaxWidth = DEFAULT_LABEL_MAX_WIDTH,
  selectedPointId,
  onPointSelected,
  anchor,
}: MatrixChartProps): JSX.Element => {
  const plotRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<PlotSize>({ width: 0, height: 0 });

  useEffect(() => {
    const plot = plotRef.current;
    if (!plot || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
      resizeChartIn(plot);
    });
    observer.observe(plot);

    return () => observer.disconnect();
  }, []);

  const quadrants = readQuadrants(children);
  const xAxis = readXAxis(children);
  const yAxis = readYAxis(children);
  const caption = readCaption(children);
  const dataTable = readDataTable(children);
  const bounds = computeBounds({ quadrants, points: data });
  const option = useMemo(() => {
    const placements = placeLabels({
      labels: toLabelRequests({ points: data, bounds, size, labelMaxWidth }),
      area: toLabelArea(size),
      obstacles: toLabelObstacles({ points: data, quadrants, bounds, size }),
      labelHeight: LABEL_HEIGHT,
      gapToPoint: LABEL_GAP_TO_POINT,
    });
    return buildOption({
      points: data,
      quadrants,
      xAxis,
      yAxis,
      bounds,
      placements,
      labelMaxWidth,
      size,
      selectedPointId,
    });
  }, [
    data,
    quadrants,
    bounds,
    size,
    xAxis,
    yAxis,
    labelMaxWidth,
    selectedPointId,
  ]);

  const onEvents = useMemo(
    () => ({
      click: ({ event }: { event: unknown }): void => {
        if (!carriesDataIndex(event) || typeof event.dataIndex !== 'number') {
          return;
        }
        onPointSelected?.(data[event.dataIndex].id);
      },
    }),
    [data, onPointSelected]
  );

  const anchorTarget = toAnchorTarget({
    anchor,
    points: data,
    bounds,
    size,
  });
  const hasAnchor = anchorTarget !== undefined;
  const hasDataTable =
    dataTable !== undefined && xAxis !== undefined && yAxis !== undefined;

  return (
    <figure className="m-0 flex w-full flex-col gap-4">
      <div
        ref={plotRef}
        aria-hidden
        className={cn('relative h-96 w-full', className)}
      >
        <ReactECharts
          renderer="svg"
          style={{ width: '100%', height: '100%' }}
          option={option}
          onEvents={onEvents}
        />
        {hasAnchor ? <AnchorSpot {...anchorTarget} /> : null}
      </div>
      <figcaption className="sr-only">{caption}</figcaption>
      <PointsList
        points={data}
        xAxis={xAxis}
        yAxis={yAxis}
        onPointSelected={onPointSelected}
      />
      {legend}
      {hasDataTable ? (
        <PointsTable
          points={data}
          xAxis={xAxis}
          yAxis={yAxis}
          dataTable={dataTable}
        />
      ) : null}
    </figure>
  );
};

export {
  buildDividers,
  buildHollowPointHalos,
  buildSelectedPointOutline,
  MatrixChart,
  POINT_SIZE,
  toPointStyle,
  toQuadrantLabel,
  toToneColor,
};
export type { MatrixAnchor, MatrixPoint };
