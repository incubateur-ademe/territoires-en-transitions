import ChartLegend from '@/app/ui/charts/ChartLegend';
import { EChartsOption, ReactECharts } from '@/app/ui/charts/echarts';
import { renderToString } from '@/app/ui/charts/echarts/renderToString';
import { readCaption } from '@/app/ui/charts/matrix/read-children';
import { preset } from '@tet/ui';
import type { BarSeriesOption } from 'echarts/charts';
import { useMemo, type JSX, type ReactNode } from 'react';
import type { StatusBar, StatusScale } from './status-bar';
import { StatusBarTooltip } from './status-bar.tooltip';

const { colors } = preset.theme.extend;

type StatusBarChartProps<TStatus extends string> = {
  data: readonly StatusBar<NoInfer<TStatus>>[];
  statusScale: StatusScale<TStatus>;
  formatValue: (value: number) => string;
  selectedBarId?: string;
  onBarSelected?: (barId: string) => void;
  children?: ReactNode;
};

const DIMMED_OPACITY = 0.3;
const BAR_GAP = '30%';
const PLOT_TOP_MARGIN = 16;

const carriesDataIndex = (
  candidate: unknown
): candidate is { dataIndex: number } =>
  typeof candidate === 'object' &&
  candidate !== null &&
  'dataIndex' in candidate &&
  typeof candidate.dataIndex === 'number';

const toSeriesData = <TStatus extends string>({
  data,
  statusScale,
  selectedBarId,
}: {
  data: readonly StatusBar<TStatus>[];
  statusScale: StatusScale<TStatus>;
  selectedBarId: string | undefined;
}): BarSeriesOption['data'] => {
  const colorByStatus = new Map(
    statusScale.map(({ status, color }) => [status, color])
  );
  return data.map((bar) => {
    const isDimmed = selectedBarId !== undefined && bar.id !== selectedBarId;
    return {
      name: bar.label,
      value: bar.value,
      itemStyle: {
        color: colorByStatus.get(bar.status) ?? colors.grey[5],
        opacity: isDimmed ? DIMMED_OPACITY : 1,
      },
    };
  });
};

const buildOption = <TStatus extends string>({
  data,
  statusScale,
  formatValue,
  selectedBarId,
}: {
  data: readonly StatusBar<TStatus>[];
  statusScale: StatusScale<TStatus>;
  formatValue: (value: number) => string;
  selectedBarId: string | undefined;
}): EChartsOption => ({
  tooltip: {
    trigger: 'item',
    confine: true,
    borderColor: colors.grey[4],
    backgroundColor: colors.grey[1],
    padding: 12,
    formatter: (params: unknown): string => {
      const bar = carriesDataIndex(params) ? data[params.dataIndex] : undefined;
      return bar
        ? renderToString(
            <StatusBarTooltip bar={bar} formatValue={formatValue} />
          )
        : '';
    },
  },
  grid: { left: 0, right: 0, top: PLOT_TOP_MARGIN, bottom: 0 },
  xAxis: {
    type: 'category',
    data: data.map((bar) => bar.id),
    axisLabel: { show: false },
    axisTick: { show: false },
    axisLine: { lineStyle: { color: colors.grey[8] } },
  },
  yAxis: {
    type: 'value',
    axisLabel: { show: false },
    splitLine: { lineStyle: { color: colors.grey[4], type: 'dashed' } },
  },
  series: [
    {
      type: 'bar',
      barCategoryGap: BAR_GAP,
      data: toSeriesData({ data, statusScale, selectedBarId }),
    },
  ],
});

const BarsList = <TStatus extends string>({
  data,
  formatValue,
  onBarSelected,
}: {
  data: readonly StatusBar<TStatus>[];
  formatValue: (value: number) => string;
  onBarSelected?: (barId: string) => void;
}): JSX.Element => (
  <ul className="sr-only">
    {data.map((bar) => {
      const description = [bar.label, bar.status, formatValue(bar.value)].join(
        ', '
      );
      return (
        <li key={bar.id}>
          {onBarSelected ? (
            <button type="button" onClick={() => onBarSelected(bar.id)}>
              {description}
            </button>
          ) : (
            description
          )}
        </li>
      );
    })}
  </ul>
);

const StatusBarChart = <TStatus extends string>({
  data,
  statusScale,
  formatValue,
  selectedBarId,
  onBarSelected,
  children,
}: StatusBarChartProps<TStatus>): JSX.Element => {
  const caption = readCaption(children);
  const option = useMemo(
    () => buildOption({ data, statusScale, formatValue, selectedBarId }),
    [data, statusScale, formatValue, selectedBarId]
  );
  const onEvents = useMemo(
    () => ({
      click: ({ event }: { event: unknown }): void => {
        if (!carriesDataIndex(event)) {
          return;
        }
        const bar = data[event.dataIndex];
        if (bar) {
          onBarSelected?.(bar.id);
        }
      },
    }),
    [data, onBarSelected]
  );
  const legendItems = statusScale.map(({ status, color }) => ({
    name: status,
    color,
  }));

  return (
    <figure className="m-0 flex h-full w-full flex-col">
      <div aria-hidden className="min-h-0 w-full grow">
        <ReactECharts
          renderer="svg"
          style={{ width: '100%', height: '100%' }}
          option={option}
          onEvents={onEvents}
        />
      </div>
      <ChartLegend isOpen size="sm" className="mt-4" items={legendItems} />
      <figcaption className="mt-2 text-sm text-grey-8">{caption}</figcaption>
      <BarsList
        data={data}
        formatValue={formatValue}
        onBarSelected={onBarSelected}
      />
    </figure>
  );
};

export { StatusBarChart };
