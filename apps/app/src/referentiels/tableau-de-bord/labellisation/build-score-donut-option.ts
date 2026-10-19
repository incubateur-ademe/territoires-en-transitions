import type { EChartsOption } from '@/app/ui/charts/echarts';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { divisionOrZero } from '@tet/domain/utils';
import type { getAggregatedScore } from '../utils';
import { buildScoreDonutTooltip } from './build-score-donut-tooltip';

export const buildScoreDonutOption = (
  data: Pick<
    ReturnType<typeof getAggregatedScore>,
    'array' | 'max_personnalise'
  >
) => {
  // ECharts ajuste `percent` pour totaliser 100 %. Les scores doivent utiliser
  // le même rapport au potentiel personnalisé que les valeurs hors du graphe.
  const getPercent = (points: number) =>
    divisionOrZero(points, data.max_personnalise) * 100;

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (Array.isArray(params)) return '';
        const { marker, name, value } = params;
        if (typeof marker !== 'string' || typeof value !== 'number') {
          return '';
        }
        return buildScoreDonutTooltip({
          marker,
          name,
          points: value,
          percent: getPercent(value),
        });
      },
      textStyle: {
        color: '#222',
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '80%'],
        padAngle: 1,
        minAngle: 0,
        minShowLabelAngle: 10,
        itemStyle: {
          borderRadius: 4,
          borderWidth: 4,
        },
        label: {
          position: 'inside',
          formatter: ({ value }) =>
            typeof value === 'number'
              ? `${toLocaleFixed(getPercent(value), 1)}%`
              : '',
          opacity: 0.7,
          fontSize: '0.9rem',
        },
        emphasis: {
          itemStyle: {
            color: 'inherit',
          },
        },
        data: data.array.map((d) => ({
          name: d.id,
          value: d.value,
          itemStyle: { color: d.color },
        })),
      },
    ],
  } satisfies EChartsOption;
};
