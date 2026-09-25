import { EChartsOption, ReactECharts } from '@/app/ui/charts/echarts';
import type { ScatterSeriesOption } from 'echarts/charts';
import { cn, preset } from '@tet/ui';
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
import type { AxisProps } from './axis';
import type { MatrixCoord } from './matrix-coord';
import { projectPoints, type PlotSize } from './project-points';
import type { MatrixTone, QuadrantProps, TitleAnchor } from './quadrant';
import {
  readCaption,
  readQuadrants,
  readXAxis,
  readYAxis,
} from './read-children';
import {
  stackLabelsVertically,
  type LabelPlacements,
} from './stack-labels';

const { colors } = preset.theme.extend;

type MatrixPoint = MatrixCoord & {
  id: string;
  label: string;
  description: string;
  tone: MatrixTone;
};

type MatrixChartProps = {
  data: readonly MatrixPoint[];
  children?: ReactNode;
  className?: string;
  onPointSelected?: (pointId: string) => void;
};

const TONE_PALETTE: Record<MatrixTone, { strong: string; soft: string }> = {
  default: { strong: colors.primary[9], soft: colors.primary[2] },
  success: { strong: colors.success[1], soft: colors.success[2] },
  warning: { strong: colors.warning[1], soft: colors.warning[2] },
  info: { strong: colors.info[1], soft: colors.info[2] },
  grey: { strong: colors.grey[7], soft: colors.grey[2] },
};

const TITLE_POSITION: Record<
  TitleAnchor,
  'insideTopLeft' | 'insideBottomRight'
> = {
  topLeft: 'insideTopLeft',
  bottomRight: 'insideBottomRight',
};

const LABEL_HEIGHT = 15;
const LABEL_GAP_TO_POINT = 10;
const TRANSPARENT = 'transparent';

const carriesDataIndex = (
  candidate: unknown
): candidate is { dataIndex: unknown } =>
  typeof candidate === 'object' && candidate !== null && 'dataIndex' in candidate;

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

const buildTooltipContent = (point: MatrixPoint): HTMLElement => {
  const content = document.createElement('div');
  content.className = 'flex max-w-64 flex-col gap-1 whitespace-normal font-sans';

  const title = document.createElement('p');
  title.className = 'm-0 text-sm font-bold text-primary-9';
  title.textContent = point.label;

  const body = document.createElement('p');
  body.className = 'm-0 text-xs font-normal leading-5 text-grey-8';
  body.textContent = point.description;

  content.append(title, body);
  return content;
};

type MarkAreaData = NonNullable<
  NonNullable<ScatterSeriesOption['markArea']>['data']
>;

type MarkAreaZone = MarkAreaData[number];

const buildArea = ({
  from,
  to,
  title,
  tone,
  titleAnchor = 'topLeft',
  colors: override,
}: QuadrantProps): MarkAreaZone => {
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
        formatter: title,
        position: TITLE_POSITION[titleAnchor],
        color: override?.title ?? palette?.strong ?? colors.grey[7],
        fontSize: 11,
        fontWeight: 'bold' as const,
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
  axisTick: { show: boolean };
  splitLine: { show: boolean };
  axisLabel: { formatter: (value: number) => string };
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
  axisTick: { show: false },
  splitLine: { show: false },
  axisLabel: { formatter: axisLabelFormatter(markers, bound) },
});

const placementAt = ({
  placements,
  dataIndex,
}: {
  placements: LabelPlacements;
  dataIndex?: number;
}) => ({
  ...(dataIndex === undefined ? undefined : placements[dataIndex]),
  align: 'center' as const,
  verticalAlign: 'bottom' as const,
  hideOverlap: false,
});

const buildOption = ({
  points,
  quadrants,
  xAxis,
  yAxis,
  bounds,
  placements,
}: {
  points: readonly MatrixPoint[];
  quadrants: readonly QuadrantProps[];
  xAxis: AxisProps | undefined;
  yAxis: AxisProps | undefined;
  bounds: MatrixCoord;
  placements: LabelPlacements;
}): EChartsOption => ({
  tooltip: {
    trigger: 'item',
    confine: true,
    borderColor: colors.grey[4],
    backgroundColor: colors.grey[1],
    padding: 12,
    formatter: (params: unknown): HTMLElement | string => {
      const point = pointAtParams({ params, points });
      return point ? buildTooltipContent(point) : '';
    },
  },
  grid: MATRIX_GRID,
  xAxis: buildAxis({ markers: xAxis, bound: bounds.x, nameGap: 40 }),
  yAxis: buildAxis({ markers: yAxis, bound: bounds.y, nameGap: 76 }),
  series: [
    {
      type: 'scatter',
      symbolSize: 14,
      data: points.map((point) => ({
        name: point.label,
        value: [point.x, point.y],
        itemStyle: { color: TONE_PALETTE[point.tone].strong },
      })),
      label: {
        show: true,
        formatter: '{b}',
        position: 'top',
        fontSize: 11,
        color: colors.grey[10],
      },
      labelLayout: ({ dataIndex }: { dataIndex?: number }) =>
        placementAt({ placements, dataIndex }),
      markArea: { silent: true, data: quadrants.map(buildArea) },
    },
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
          {xAxis ? <dd>{point.x}</dd> : null}
          {yAxis ? <dt>{yAxis.name}</dt> : null}
          {yAxis ? <dd>{point.y}</dd> : null}
        </dl>
        <p>{point.description}</p>
      </li>
    ))}
  </ul>
);

const MatrixChart = ({
  data,
  children,
  className,
  onPointSelected,
}: MatrixChartProps): JSX.Element => {
  const plotRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<PlotSize>({ width: 0, height: 0 });

  useEffect(() => {
    const plot = plotRef.current;
    if (!plot || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    );
    observer.observe(plot);

    return () => observer.disconnect();
  }, []);

  const quadrants = readQuadrants(children);
  const xAxis = readXAxis(children);
  const yAxis = readYAxis(children);
  const caption = readCaption(children);
  const bounds = computeBounds({ quadrants, points: data });
  const option = useMemo(() => {
    const placements = stackLabelsVertically({
      anchors: projectPoints({ points: data, bounds, grid: MATRIX_GRID, size }),
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
    });
  }, [data, quadrants, bounds, size, xAxis, yAxis]);

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

  return (
    <figure className={cn('m-0 h-96 w-full', className)}>
      <div ref={plotRef} aria-hidden className="h-full w-full">
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
    </figure>
  );
};

export { MatrixChart };
export type { AxisProps, MatrixChartProps, MatrixPoint };
