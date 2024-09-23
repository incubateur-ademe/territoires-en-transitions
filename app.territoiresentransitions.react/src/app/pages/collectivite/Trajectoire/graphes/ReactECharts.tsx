/**
 * Wrapper pour les graphes ECharts
 *
 * Ref: https://dev.to/manufac/using-apache-echarts-with-react-and-typescript-353k
 */

import {useRef, useEffect} from 'react';
import {init, getInstanceByDom} from 'echarts';
import type {CSSProperties} from 'react';
import type {EChartsOption, ECharts, SetOptionOpts} from 'echarts';
import {preset} from '@tet/ui';

const {colors} = preset.theme.extend;

export interface ReactEChartsProps {
  option: EChartsOption;
  style?: CSSProperties;
  settings?: SetOptionOpts;
  loading?: boolean;
  theme?: 'light' | 'dark';
}

const DEFAULT_STYLE: CSSProperties = {
  color: colors.primary['9'],
  height: 600,
};

export function ReactECharts({
  option,
  style = DEFAULT_STYLE,
  settings,
  loading,
  theme,
}: ReactEChartsProps): JSX.Element {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chart
    let chart: ECharts | undefined;
    if (chartRef.current !== null) {
      chart = init(chartRef.current, theme);
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
  }, [theme]);

  useEffect(() => {
    // Update chart
    if (chartRef.current !== null) {
      const chart = getInstanceByDom(chartRef.current);
      chart?.setOption(option, settings);
    }
  }, [option, settings, theme]); // Whenever theme changes we need to add option and setting due to it being deleted in cleanup function

  useEffect(() => {
    // Update chart
    if (chartRef.current !== null) {
      const chart = getInstanceByDom(chartRef.current);
      if (chart) {
        if (loading === true) {
          chart.showLoading();
        } else {
          chart.hideLoading();
        }
      }
    }
  }, [loading, theme]);

  return <div ref={chartRef} style={{width: '100%', ...style}} />;
}
