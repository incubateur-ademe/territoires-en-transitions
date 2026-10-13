import { type Dataset, makeStackedSeries } from '@/app/ui/charts/echarts/utils';
import type { LineSeriesOption } from 'echarts/charts';

type SegmentDataset = Dataset & {
  source: { valeur?: number | null }[];
};

export const makeSegmentSeries = (
  dataset: SegmentDataset[]
): LineSeriesOption[] =>
  makeStackedSeries(dataset).map((series, index) => ({
    ...series,
    // Une observation isolée ne forme aucune surface : on affiche son point.
    symbol: (_value, { dataIndex }) =>
      dataset[index].source[dataIndex - 1]?.valeur == null &&
      dataset[index].source[dataIndex + 1]?.valeur == null
        ? 'circle'
        : 'none',
    symbolSize: 6,
    connectNulls: false,
  }));
