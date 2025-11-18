/**
 * TODO: to be shared with app
 */

import type { CountByResponseType } from '@tet/domain/utils';
import type {
  EChartsOption,
  PieSeriesOption,
} from 'echarts/types/dist/echarts';
import { cloneDeep } from 'es-toolkit';

type Args = {
  displayItemsLabel: boolean;
  countByResponse: CountByResponseType;
};

export const getPieChartOption = ({
  displayItemsLabel,
  countByResponse,
}: Args): EChartsOption => {
  const { countByResult, total } = countByResponse;
  const pieChartData = Object.entries(countByResult)
    .map(([, { count, value, label, color }]) => {
      return {
        name: label || `${value}`,
        name_id: value,
        value: count,
        itemStyle: color
          ? {
              color,
            }
          : undefined,
      };
    })
    .filter((item) => item.value);

  const pieChartSeries: PieSeriesOption = {
    name: '',
    type: 'pie',
    radius: ['25%', '45%'],
    avoidLabelOverlap: false,
    labelLine: {
      show: false,
    },
    label: {
      show: true,
      overflow: 'truncate',
      position: 'inside',
      formatter: '{c}',
    },
    emphasis: {
      label: { show: true },
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
      },
    },
    data: pieChartData,
  };

  const series: PieSeriesOption[] = [];
  if (displayItemsLabel) {
    // A bit a hack, but the way to have two labels: https://github.com/apache/echarts/issues/18383
    const itemlabelSeries: PieSeriesOption = cloneDeep(pieChartSeries);
    delete itemlabelSeries.emphasis;
    itemlabelSeries.label = {
      show: true,
      position: 'outside',
    };
    itemlabelSeries.labelLine = {
      show: true,
    };
    itemlabelSeries.avoidLabelOverlap = true;
    series.push(itemlabelSeries);
  }
  series.push(pieChartSeries);

  return {
    legend: {
      show: false,
    },
    title: {
      left: 'center',
      top: 'center',
      text: `${total}`,
      subtext: 'actions',
      itemGap: 0,
      textStyle: {
        color: '#404092', // TODO: color from app
        fontWeight: 700,
        fontSize: 28, // Better to set px instead of rem for SSR
      },
      subtextStyle: {
        color: '#929292',
        fontWeight: 400,
        fontSize: 20, // Better to set px instead of rem for SSR
      },
    },
    series: series,
  };
};
