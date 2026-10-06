import { EChartsOption, ReactECharts } from '@/app/ui/charts/echarts';
import { renderToString } from '@/app/ui/charts/echarts/renderToString';
import type {
  EffectScatterSeriesOption,
  ScatterSeriesOption,
} from 'echarts/charts';
import { getInstanceByDom } from 'echarts/core';
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
} from 'react';
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
  hint?: string;
  tone: MatrixTone;
  color?: string;
  isLabelled?: boolean;
};

type MatrixChartProps = {
  data: readonly MatrixPoint[];
  children?: ReactNode;
  className?: string;
  legend?: ReactNode;
  labelMaxWidth?: number;
  selectedPointId?: string;
  onPointSelected?: (pointId: string) => void;
};

const TONE_PALETTE: Record<MatrixTone, { strong: string; soft: string }> = {
  default: { strong: colors.primary[9], soft: colors.primary[2] },
  success: { strong: colors.success[1], soft: colors.success[2] },
  warning: { strong: colors.warning[1], soft: colors.warning[2] },
  error: { strong: colors.error[1], soft: colors.error[2] },
  info: { strong: colors.info[1], soft: colors.info[2] },
  grey: { strong: colors.grey[7], soft: colors.grey[2] },
  light: { strong: colors.grey[4], soft: colors.grey[1] },
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
const SELECTION_RING_WIDTH = 4;
const AXIS_FONT_SIZE = 11;
const LABEL_GAP_TO_POINT = 12;
const LABEL_RIGHT_MARGIN = 4;
const DEFAULT_LABEL_MAX_WIDTH = 220;
const QUADRANT_TITLE_INSET = 8;
const QUADRANT_TITLE_DISTANCE = 5;
const QUADRANT_TITLE_CHAR_WIDTH = 8;
const QUADRANT_TITLE_LINE_HEIGHT = 14;
const TRANSPARENT = 'transparent';
const DESCRIPTION_SEPARATOR = ' · ';
const PULSE_RIPPLE = { brushType: 'stroke', scale: 2.5, period: 2 } as const;

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
  <div className="flex max-w-64 flex-col gap-1 whitespace-normal font-sans">
    <p className="m-0 text-sm font-bold text-primary-9">{point.label}</p>
    {toDescriptionLines(point.description).map((line) => (
      <p key={line} className="m-0 text-xs font-normal leading-5 text-grey-8">
        {line}
      </p>
    ))}
    {point.hint !== undefined ? (
      <p className="m-0 mt-1 text-xs font-normal italic text-grey-7">
        {point.hint}
      </p>
    ) : null}
  </div>
);

type MarkAreaData = NonNullable<
  NonNullable<ScatterSeriesOption['markArea']>['data']
>;

type MarkAreaZone = MarkAreaData[number];

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
        borderColor: colors.grey[5],
        borderWidth: 1,
        borderType: 'dashed' as const,
      },
      label: {
        show: title !== undefined,
        formatter: title?.toLocaleUpperCase('fr-FR'),
        position: TITLE_POSITION[titleAnchor],
        color: override?.title ?? palette?.strong ?? colors.grey[7],
        fontSize: 11,
        fontWeight: 'bold' as const,
        width: titleWidth,
        overflow: 'break' as const,
        lineHeight: QUADRANT_TITLE_LINE_HEIGHT,
      },
    },
    { coord: [to.x, to.y] },
  ];
};

type MatrixAxis = {
  type: 'value';
  min: number;
  max: number;
  name: string;
  nameLocation: 'middle';
  nameGap: number;
  nameTextStyle: { fontSize: number };
  axisTick: { show: boolean };
  splitLine: { show: boolean };
  axisLabel: { formatter: (value: number) => string; fontSize: number };
};

const axisLabelFormatter =
  (markers: AxisProps | undefined, bound: number) =>
  (value: number): string => {
    if (!markers) {
      return '';
    }
    if (value === 0) {
      return markers.minLabel;
    }
    if (value === bound) {
      return markers.maxLabel;
    }
    return '';
  };

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
  name: markers?.name ?? '',
  nameLocation: 'middle' as const,
  nameGap,
  nameTextStyle: { fontSize: AXIS_FONT_SIZE },
  axisTick: { show: false },
  splitLine: { show: false },
  axisLabel: {
    formatter: axisLabelFormatter(markers, bound),
    fontSize: AXIS_FONT_SIZE,
  },
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
};

const toPointColor = (point: MatrixPoint): string =>
  point.color ?? TONE_PALETTE[point.tone].strong;

const toPointStyle = ({
  point,
  isSelected,
}: {
  point: MatrixPoint;
  isSelected: boolean;
}): PointStyle => ({
  color: toPointColor(point),
  borderColor: isSelected ? colors.grey[5] : TRANSPARENT,
  borderWidth: isSelected ? SELECTION_RING_WIDTH : 0,
});

const buildSelectedPointPulse = ({
  points,
  selectedPointId,
}: {
  points: readonly MatrixPoint[];
  selectedPointId: string | undefined;
}): EffectScatterSeriesOption[] => {
  const selectedPoint = points.find((point) => point.id === selectedPointId);
  if (selectedPoint === undefined) {
    return [];
  }
  return [
    {
      type: 'effectScatter',
      silent: true,
      z: 1,
      symbolSize: POINT_SIZE,
      showEffectOn: 'render',
      rippleEffect: PULSE_RIPPLE,
      data: [
        {
          value: [selectedPoint.x, selectedPoint.y],
          itemStyle: { color: toPointColor(selectedPoint) },
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
  xAxis: buildAxis({ markers: xAxis, bound: bounds.x, nameGap: 40 }),
  yAxis: buildAxis({ markers: yAxis, bound: bounds.y, nameGap: 76 }),
  series: [
    {
      type: 'effectScatter',
      symbolSize: POINT_SIZE,
      showEffectOn: 'emphasis',
      rippleEffect: PULSE_RIPPLE,
      data: points.map((point, dataIndex) => ({
        name: point.label,
        value: [point.x, point.y],
        itemStyle: toPointStyle({
          point,
          isSelected: point.id === selectedPointId,
        }),
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
    },
    ...buildSelectedPointPulse({ points, selectedPointId }),
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
  if (quadrant.title === undefined || quadrantBox === undefined) {
    return undefined;
  }
  const titleTextWidth = quadrant.title.length * QUADRANT_TITLE_CHAR_WIDTH;
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

const MatrixChart = ({
  data,
  children,
  className,
  legend,
  labelMaxWidth = DEFAULT_LABEL_MAX_WIDTH,
  selectedPointId,
  onPointSelected,
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

  const hasDataTable =
    dataTable !== undefined && xAxis !== undefined && yAxis !== undefined;

  return (
    <figure className="m-0 flex w-full flex-col gap-4">
      <div ref={plotRef} aria-hidden className={cn('h-96 w-full', className)}>
        <ReactECharts
          renderer="svg"
          style={{ width: '100%', height: '100%' }}
          option={option}
          onEvents={onEvents}
        />
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

export { MatrixChart };
export type { MatrixPoint };
