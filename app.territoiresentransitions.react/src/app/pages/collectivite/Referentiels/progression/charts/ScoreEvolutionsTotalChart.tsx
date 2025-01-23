import { ReactECharts } from '@/app/ui/charts/echarts';

import type { EChartsOption } from 'echarts';
import { fakeScoreSnapshots } from '../mocks/fake-score-snapshots';
import { actionAvancementColors } from '@/app/app/theme';

const ScoreEvolutionsTotalChart = () => {
  const snapshots = fakeScoreSnapshots.slice(-4);

  const yearAndNameLabels = snapshots.map((snapshot) => {
    if (!snapshot.snapshot?.nom) {
      return 'Sans nom';
    }
    return `${extractYearFromDate(snapshot.snapshot.createdAt)} - ${
      snapshot.snapshot.nom
    }`;
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
      barWidth: getBarWidth(snapshots.length),
      emphasis: {
        focus: 'series' as const,
      },
      itemStyle: {
        color: actionAvancementColors.fait,
      },
      data: snapshots.map((snapshot) =>
        computePercentage(
          snapshot.scores.score.pointFait,
          snapshot.scores.score.pointPotentiel
        )
      ),
    },
    {
      name: 'Programmé',
      type: 'bar' as const,
      stack: 'total',
      barWidth: getBarWidth(snapshots.length),
      emphasis: {
        focus: 'series' as const,
      },
      itemStyle: {
        color: actionAvancementColors.programme,
      },
      data: snapshots.map((snapshot) =>
        computePercentage(
          snapshot.scores.score.pointProgramme,
          snapshot.scores.score.pointPotentiel
        )
      ),
    },
    {
      name: 'Pas fait',
      type: 'bar' as const,
      stack: 'total',
      barWidth: getBarWidth(snapshots.length),
      emphasis: {
        focus: 'series' as const,
      },
      itemStyle: {
        color: actionAvancementColors.pas_fait,
      },
      data: snapshots.map((snapshot) =>
        computePercentage(
          snapshot.scores.score.pointPasFait,
          snapshot.scores.score.pointPotentiel
        )
      ),
    },
    {
      name: 'Non renseigné',
      type: 'bar' as const,
      stack: 'total',
      barWidth: getBarWidth(snapshots.length),
      emphasis: {
        focus: 'series' as const,
      },
      itemStyle: {
        color: actionAvancementColors.non_renseigne,
      },
      data: snapshots.map((snapshot) =>
        computePercentage(
          snapshot.scores.score.pointNonRenseigne,
          snapshot.scores.score.pointPotentiel
        )
      ),
      label: {
        show: true,
        position: 'top' as const,
        distance: 5,
        formatter: (params: any) =>
          makeScoreSnapshotLabel(
            snapshots[params.dataIndex].scores.score.pointFait,
            snapshots[params.dataIndex].scores.score.pointPotentiel
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
            return `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span>${param.seriesName}: ${param.value}%`;
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
        data: yearAndNameLabels,
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

const extractYearFromDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.getFullYear().toString();
};

const makeScoreSnapshotLabel = (pointFait: number, pointPotentiel: number) => {
  const percentage = (pointFait / pointPotentiel) * 100;
  return `{percent|${percentage.toFixed(1)}%} ${pointFait.toFixed(
    1
  )}/${pointPotentiel.toFixed(1)} pts`;
};

const computePercentage = (point: number, pointPotentiel: number) => {
  return ((point / pointPotentiel) * 100).toFixed(1);
};
