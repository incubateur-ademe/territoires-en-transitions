/**
 * Wrapper pour les graphes ECharts
 *
 * Ref: https://dev.to/manufac/using-apache-echarts-with-react-and-typescript-353k
 */

import { preset } from '@/ui';
import type {
  ECElementEvent,
  ECharts,
  EChartsInitOpts,
  EChartsOption,
  EChartsType,
  ElementEvent,
  SetOptionOpts,
} from 'echarts';
import { getInstanceByDom, init } from 'echarts';
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';

const { colors } = preset.theme.extend;

/**
 * ECharts event
 */
export type EchartEventType = ElementEvent['event'] | ECElementEvent;

export type EchartEventName =
  | ElementEvent['type']
  | 'brushSelected'
  | 'rendered'
  | 'finished'
  | 'dataZoom'
  | 'legendselectchanged';

export interface ReactEChartsProps {
  option: EChartsOption;
  style?: CSSProperties;
  heightRatio?: number;
  settings?: SetOptionOpts;
  loading?: boolean;
  theme?: 'light' | 'dark';
  onEvents?: Partial<
    Record<
      EchartEventName,
      ({
        event,
        chartInstance,
      }: {
        event: EchartEventType;
        chartInstance: EChartsType;
      }) => void
    >
  >;
}

const DEFAULT_CHART_STYLE: CSSProperties = {
  color: colors.primary['9'],
  width: '100%',
  height: 600,
};

const DEFAULT_SETTINGS: SetOptionOpts = {
  // pour éviter que des données persistent quand on passe d'un graphe à un autre
  notMerge: true,
};

export function ReactECharts({
  option,
  style = {},
  settings = {},
  heightRatio,
  loading,
  onEvents,
  theme,
}: ReactEChartsProps): JSX.Element {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartStyle, setChartStyle] = useState<CSSProperties>({
    ...DEFAULT_CHART_STYLE,
    ...style,
  });

  useEffect(() => {
    // Initialize chart
    let chart: ECharts | undefined;
    if (chartRef.current !== null) {
      let height: number | undefined = undefined;

      // We create a temporary chart, see https://github.com/hustcc/echarts-for-react/pull/464/commits/bf7f9a7edab0103b60b152db7f9cf45ff0f83205
      if (heightRatio) {
        chart = init(chartRef.current, theme);
        height = chartRef.current.clientWidth * heightRatio;
        chart.dispose();
        setChartStyle((prev) => ({ ...prev, height }));
      }

      const opts: EChartsInitOpts | undefined =
        heightRatio && height
          ? {
              height: height,
            }
          : undefined;
      chart = init(chartRef.current, theme, opts);
    }

    // Add chart resize listener
    // ResizeObserver is leading to a bit janky UX
    function resizeChart() {
      chart?.resize();
    }
    window.addEventListener('resize', resizeChart);

    // Return cleanup function
    return () => {
      chart?.dispose();
      window.removeEventListener('resize', resizeChart);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, heightRatio]);

  useEffect(() => {
    // Update chart
    if (chartRef.current !== null) {
      const chartSettings = { ...DEFAULT_SETTINGS, ...settings };
      const chart = getInstanceByDom(chartRef.current);
      chart?.setOption(option, chartSettings);
    }
  }, [option, settings, theme]); // Whenever theme changes we need to add option and setting due to it being deleted in cleanup function

  /**
   * From https://github.com/react-mern/echarts-wrapper-react/blob/main/src/components/EChartsReact.tsx#L102
   */
  // Bind event handlers to ECharts events
  useEffect(() => {
    const bindOrUnbindEvents = (
      events: ReactEChartsProps['onEvents'],
      bind: boolean
    ) => {
      if (!events) return;
      const values = Object.keys(events) as ElementEvent['type'][];
      if (chartRef.current) {
        const chartInstance = getInstanceByDom(chartRef.current);
        if (chartInstance) {
          values.forEach((event) => {
            const handler = (e: EchartEventType) =>
              events?.[event]?.({ event: e, chartInstance });
            if (!handler) return;
            if (bind) {
              chartInstance.on(event, handler);
              return;
            }
            chartInstance.off(event);
          });
        }
      }
    };
    bindOrUnbindEvents(onEvents || {}, true);

    return () => {
      bindOrUnbindEvents(onEvents || {}, false);
    };
  }, [onEvents]);

  useEffect(() => {
    if (chartRef.current !== null) {
      const chart = chartRef.current
        ? getInstanceByDom(chartRef.current)
        : undefined;
      if (!chart) {
        return;
      }
      loading ? chart.showLoading() : chart.hideLoading();
    }
  }, [loading, theme]);

  return <div ref={chartRef} style={chartStyle} />;
}
