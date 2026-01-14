/**
 * TODO: to be shared with app
 */

export const CHART_FONT_FAMILY = 'Poppins';

import type { CountByForEntityResponseType } from '@tet/domain/utils';
import type {
  BarSeriesOption,
  EChartsOption,
} from 'echarts/types/dist/echarts';

type Args = {
  countByResponses: CountByForEntityResponseType[];
  orderedStackedKeys?: string[];
};

export const getHorizontalStackedBarChartOption = ({
  countByResponses,
  orderedStackedKeys,
}: Args): EChartsOption => {
  const orderedCategories = countByResponses.sort((a, b) =>
    b.nom.localeCompare(a.nom, undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  );
  const categoryData = orderedCategories.map(
    (countByResponse) => countByResponse.nom
  );

  const seriesKeys =
    orderedStackedKeys ??
    [
      ...new Set(
        countByResponses
          .map((countByResponse) => Object.keys(countByResponse.countByResult))
          .flat()
      ),
    ].sort((a, b) => a.localeCompare(b));

  const barSeries: BarSeriesOption[] = seriesKeys
    .map((seriesKey) => {
      const firstDefined = orderedCategories.find(
        (countByResponse) => countByResponse.countByResult[seriesKey]
      );
      const color = firstDefined?.countByResult[seriesKey]?.color;
      const label = firstDefined?.countByResult[seriesKey]?.label ?? seriesKey;

      const values = orderedCategories.map(
        (countByResponse) =>
          countByResponse.countByResult[seriesKey]?.count ?? 0
      );
      const haveData = values.some((value) => value > 0);
      if (!haveData) {
        return null;
      }
      const seriesData: BarSeriesOption = {
        name: label,
        id: seriesKey,
        type: 'bar',
        stack: 'total',
        label: {
          show: true,
          formatter: (p) => (p.value ? `${p.value}` : ''),
        },
        itemStyle: color ? { color } : undefined,
        data: values,
      };
      return seriesData;
    })
    .filter((series): series is BarSeriesOption => series !== null);

  const option: EChartsOption = {
    textStyle: {
      fontFamily: CHART_FONT_FAMILY,
    },
    grid: {
      top: 70,
      left: 70,
      right: 70,
      bottom: 35,
      containLabel: true,
    },

    tooltip: {
      trigger: 'axis',
      axisPointer: {
        // Use axis to trigger tooltip
        type: 'shadow', // 'shadow' as default; can also be 'line' or 'shadow'
      },
    },
    legend: {
      top: 10
    },
    xAxis: {
      type: 'value',
    },
    yAxis: {
      type: 'category',
      data: categoryData,
      axisLabel: {
        fontSize: 24,
        fontFamily: CHART_FONT_FAMILY,
        width: 450,
        overflow: 'break',
      },
    },
    series: barSeries,
  };

  return option;
};
