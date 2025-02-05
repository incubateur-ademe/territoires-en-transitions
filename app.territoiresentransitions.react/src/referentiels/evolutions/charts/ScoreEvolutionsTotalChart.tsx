import { ReactECharts } from '@/app/ui/charts/echarts';

import type { EChartsOption } from 'echarts';
import { actionAvancementColors } from '@/app/app/theme';
import { SnapshotDetails } from '../../use-snapshot';
import { sortByDate } from '../utils';

const ScoreEvolutionsTotalChart = ({
  snapshots,
}: {
  snapshots: SnapshotDetails[];
}) => {
  const sortSnapshots = (snapshots: SnapshotDetails[], ascending = true) => {
    return [...snapshots].sort((a, b) => sortByDate(a.date, b.date, ascending));
  };

  const sortedSnapshots = sortSnapshots(snapshots, true);

  const nameLabels = sortedSnapshots?.map((snapshot) => {
    if (!snapshot.nom) {
      return 'Sans nom';
    }
    return `${snapshot.nom}`;
  });

  const getBarWidth = (snapshotsCount: number) => {
    if (snapshotsCount === 1) return '20%';
    if (snapshotsCount === 2) return '30%';
    if (snapshotsCount === 3) return '40%';
    return '60%';
  };

  const series = [
    {
      name: 'Fait',
      type: 'bar' as const,
      stack: 'total',
      barWidth: getBarWidth(snapshots?.length ?? 0),
      emphasis: {
        focus: 'series' as const,
      },
      itemStyle: {
        color: actionAvancementColors.fait,
      },
      data: sortedSnapshots?.map((snapshot) =>
        computePercentage(
          snapshot?.pointFait ?? 0,
          snapshot?.pointPotentiel ?? 0
        )
      ),
    },
    {
      name: 'Programmé',
      type: 'bar' as const,
      stack: 'total',
      barWidth: getBarWidth(snapshots?.length ?? 0),
      emphasis: {
        focus: 'series' as const,
      },
      itemStyle: {
        color: actionAvancementColors.programme,
      },
      data: sortedSnapshots?.map((snapshot) =>
        computePercentage(
          snapshot?.pointProgramme ?? 0,
          snapshot?.pointPotentiel ?? 0
        )
      ),
    },
    {
      name: 'Pas fait',
      type: 'bar' as const,
      stack: 'total',
      barWidth: getBarWidth(snapshots?.length ?? 0),
      emphasis: {
        focus: 'series' as const,
      },
      itemStyle: {
        color: actionAvancementColors.pas_fait,
      },
      data: sortedSnapshots?.map((snapshot) =>
        computePercentage(snapshot.pointPasFait, snapshot.pointPotentiel)
      ),
    },
    {
      name: 'Non renseigné',
      type: 'bar' as const,
      stack: 'total',
      barWidth: getBarWidth(snapshots?.length ?? 0),
      emphasis: {
        focus: 'series' as const,
      },
      itemStyle: {
        color: actionAvancementColors.non_renseigne,
      },
      data: sortedSnapshots?.map((snapshot) =>
        computePercentage(
          snapshot.pointNonRenseigne ?? 0,
          snapshot.pointPotentiel ?? 0
        )
      ),
      label: {
        show: true,
        position: 'top' as const,
        distance: 5,
        formatter: (params: any) =>
          makeScoreSnapshotLabel(
            sortedSnapshots[params.dataIndex].pointFait,
            sortedSnapshots[params.dataIndex].pointPotentiel
          ),
        fontWeight: 'normal' as const,
        rich: {
          percent: {
            fontWeight: 'bold' as const,
          },
        },
      },
    },
  ];

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: {
        type: 'shadow' as const,
      },
      formatter: (params: any) => {
        return params
          .map((param: any) => {
            const circle = `<span style="display: inline-block; margin-right: 4px; border-radius: 10px; width: 10px; height: 10px; background-color: ${param.color};"></span>`;
            return `${circle}${param.seriesName}: ${param.value}%`;
          })
          .join('<br/>');
      },
    },
    legend: {
      data: ['Non renseigné', 'Pas fait', 'Programmé', 'Fait'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category' as const,
        data: nameLabels,
      },
    ],
    yAxis: [
      {
        type: 'value' as const,
        name: '%',
        min: 0,
        max: 100,
        interval: 10,
        axisLabel: {
          formatter: '{value}%',
        },
      },
    ],
    series,
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default ScoreEvolutionsTotalChart;

const makeScoreSnapshotLabel = (pointFait: number, pointPotentiel: number) => {
  const percentage = (pointFait / pointPotentiel) * 100;
  return `{percent|${percentage.toFixed(1)}%} ${pointFait.toFixed(
    1
  )}/${pointPotentiel.toFixed(1)} pts`;
};

const computePercentage = (point: number, pointPotentiel: number) => {
  return ((point / pointPotentiel) * 100).toFixed(1);
};
